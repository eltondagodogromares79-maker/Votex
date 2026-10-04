use async_trait::async_trait;
use core_infra::AppError;
use sqlx::{FromRow, PgPool};
use uuid::Uuid;

use crate::{
    application::ports::pageant_staff_workflow::PageantStaffWorkflow,
    domain::pageant_staff::{PageantStaffMember, PageantStaffRole},
};

pub struct PostgresPageantStaffWorkflow {
    pool: PgPool,
}

impl PostgresPageantStaffWorkflow {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[derive(FromRow)]
struct PageantStaffRow {
    user_id: Uuid,
    email: String,
    first_name: String,
    last_name: String,
    is_active: bool,
}

impl PageantStaffRow {
    fn into_member(self, role: PageantStaffRole) -> PageantStaffMember {
        PageantStaffMember {
            user_id: self.user_id,
            email: self.email,
            first_name: self.first_name,
            last_name: self.last_name,
            role,
            is_active: self.is_active,
        }
    }
}

#[async_trait]
impl PageantStaffWorkflow for PostgresPageantStaffWorkflow {
    async fn assign(
        &self,
        organization_id: Uuid,
        pageant_id: Uuid,
        assigned_by: Uuid,
        email: &str,
        first_name: Option<&str>,
        last_name: Option<&str>,
        password_hash: Option<&str>,
        role: PageantStaffRole,
    ) -> Result<(PageantStaffMember, bool), AppError> {
        let mut transaction = self.pool.begin().await.map_err(database_error)?;

        let pageant_exists = sqlx::query_scalar::<_, bool>(
            "SELECT EXISTS (SELECT 1 FROM pageants WHERE id = $1 AND organization_id = $2)",
        )
        .bind(pageant_id)
        .bind(organization_id)
        .fetch_one(&mut *transaction)
        .await
        .map_err(database_error)?;
        if !pageant_exists {
            return Err(AppError::NotFound("pageant".to_owned()));
        }

        let (user_id, account_created) = if role == PageantStaffRole::Coordinator {
            let user_id = sqlx::query_scalar::<_, Uuid>(
                "SELECT id FROM users WHERE email = $1 AND status = 'ACTIVE'::user_account_status",
            )
            .bind(email)
            .fetch_optional(&mut *transaction)
            .await
            .map_err(database_error)?
            .ok_or_else(|| {
                AppError::NotFound("active organization coordinator for email".to_owned())
            })?;
            (user_id, false)
        } else {
            let first_name = first_name
                .ok_or_else(|| AppError::BadRequest("first_name is required".to_owned()))?;
            let last_name = last_name
                .ok_or_else(|| AppError::BadRequest("last_name is required".to_owned()))?;
            let password_hash = password_hash
                .ok_or_else(|| AppError::BadRequest("password is required".to_owned()))?;
            let inserted=sqlx::query_scalar::<_,Uuid>("INSERT INTO users (id,email,password_hash,first_name,last_name,status,email_verified_at) VALUES ($1,$2,$3,$4,$5,'ACTIVE'::user_account_status,now()) ON CONFLICT (email) DO NOTHING RETURNING id")
                .bind(Uuid::new_v4()).bind(email).bind(password_hash).bind(first_name.trim()).bind(last_name.trim())
                .fetch_optional(&mut *transaction).await.map_err(database_error)?;
            match inserted {
                Some(id) => (id, true),
                None => {
                    let id=sqlx::query_scalar::<_,Uuid>("SELECT id FROM users WHERE email=$1 AND status='ACTIVE'::user_account_status")
                    .bind(email).fetch_optional(&mut *transaction).await.map_err(database_error)?.ok_or(AppError::EmailTaken)?;
                    (id, false)
                }
            }
        };

        if role == PageantStaffRole::Coordinator {
            let is_organization_coordinator = sqlx::query_scalar::<_, bool>(
                r#"
                SELECT EXISTS (
                    SELECT 1
                    FROM organization_members om
                    INNER JOIN organization_member_roles omr ON omr.organization_member_id = om.id
                    INNER JOIN roles organization_role ON organization_role.id = omr.role_id
                    WHERE om.organization_id = $1 AND om.user_id = $2 AND om.is_active = TRUE
                      AND organization_role.code = 'ORG_COORDINATOR'
                      AND organization_role.scope = 'ORGANIZATION'::role_scope
                      AND organization_role.is_active = TRUE
                )
                "#,
            )
            .bind(organization_id)
            .bind(user_id)
            .fetch_one(&mut *transaction)
            .await
            .map_err(database_error)?;
            if !is_organization_coordinator {
                return Err(AppError::Forbidden);
            }
        }

        // The database requires assigned pageant judges and tabulators to be
        // active members of the pageant's organization.
        sqlx::query(
            r#"
            INSERT INTO organization_members (organization_id, user_id)
            VALUES ($1, $2)
            ON CONFLICT (organization_id, user_id)
            DO UPDATE SET is_active = TRUE, updated_at = now()
            "#,
        )
        .bind(organization_id)
        .bind(user_id)
        .execute(&mut *transaction)
        .await
        .map_err(database_error)?;

        let role_id = sqlx::query_scalar::<_, Uuid>(
            "SELECT id FROM roles WHERE code = $1 AND scope = 'PAGEANT'::role_scope AND is_active = TRUE",
        )
        .bind(role.role_code())
        .fetch_optional(&mut *transaction)
        .await
        .map_err(database_error)?
        .ok_or_else(|| AppError::Configuration(format!("{} role is not configured", role.role_code())))?;

        sqlx::query(
            r#"
            INSERT INTO pageant_member_roles (
                pageant_id, user_id, role_id, assigned_by, is_active
            )
            VALUES ($1, $2, $3, $4, TRUE)
            ON CONFLICT (pageant_id, user_id, role_id)
            DO UPDATE SET assigned_by = EXCLUDED.assigned_by, is_active = TRUE
            "#,
        )
        .bind(pageant_id)
        .bind(user_id)
        .bind(role_id)
        .bind(assigned_by)
        .execute(&mut *transaction)
        .await
        .map_err(database_error)?;

        let row = sqlx::query_as::<_, PageantStaffRow>(
            r#"
            SELECT u.id AS user_id, u.email::text AS email, u.first_name, u.last_name,
                   pmr.is_active
            FROM pageant_member_roles pmr
            INNER JOIN users u ON u.id = pmr.user_id
            WHERE pmr.pageant_id = $1 AND pmr.user_id = $2 AND pmr.role_id = $3
            "#,
        )
        .bind(pageant_id)
        .bind(user_id)
        .bind(role_id)
        .fetch_one(&mut *transaction)
        .await
        .map_err(database_error)?;

        transaction.commit().await.map_err(database_error)?;
        Ok((row.into_member(role), account_created))
    }

    async fn list(
        &self,
        organization_id: Uuid,
        pageant_id: Uuid,
        role: PageantStaffRole,
    ) -> Result<Vec<PageantStaffMember>, AppError> {
        let rows = sqlx::query_as::<_, PageantStaffRow>(
            r#"
            SELECT u.id AS user_id, u.email::text AS email, u.first_name, u.last_name,
                   pmr.is_active
            FROM pageant_member_roles pmr
            INNER JOIN pageants p ON p.id = pmr.pageant_id
            INNER JOIN roles r ON r.id = pmr.role_id
            INNER JOIN users u ON u.id = pmr.user_id
            WHERE p.organization_id = $1
              AND p.id = $2
              AND r.code = $3
            ORDER BY u.last_name, u.first_name, u.email
            "#,
        )
        .bind(organization_id)
        .bind(pageant_id)
        .bind(role.role_code())
        .fetch_all(&self.pool)
        .await
        .map_err(database_error)?;

        Ok(rows.into_iter().map(|row| row.into_member(role)).collect())
    }

    async fn revoke(
        &self,
        organization_id: Uuid,
        pageant_id: Uuid,
        user_id: Uuid,
        role: PageantStaffRole,
    ) -> Result<(), AppError> {
        let revoked_id = sqlx::query_scalar::<_, Uuid>(
            r#"
            UPDATE pageant_member_roles pmr
            SET is_active = FALSE
            FROM pageants p, roles r
            WHERE pmr.pageant_id = p.id
              AND p.organization_id = $1
              AND p.id = $2
              AND pmr.user_id = $3
              AND pmr.role_id = r.id
              AND r.code = $4
              AND pmr.is_active = TRUE
            RETURNING pmr.id
            "#,
        )
        .bind(organization_id)
        .bind(pageant_id)
        .bind(user_id)
        .bind(role.role_code())
        .fetch_optional(&self.pool)
        .await
        .map_err(database_error)?;

        revoked_id
            .map(|_| ())
            .ok_or_else(|| AppError::NotFound("active pageant assignment".to_owned()))
    }
}

fn database_error(error: sqlx::Error) -> AppError {
    AppError::Database(Box::new(error))
}
