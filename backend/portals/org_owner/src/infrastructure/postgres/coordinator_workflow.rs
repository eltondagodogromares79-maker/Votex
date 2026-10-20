use async_trait::async_trait;
use core_infra::AppError;
use sqlx::{FromRow, PgPool};
use uuid::Uuid;

use crate::{
    application::ports::coordinator_workflow::CoordinatorWorkflow,
    domain::coordinator::OrganizationCoordinator,
};

pub struct PostgresCoordinatorWorkflow {
    pool: PgPool,
}

impl PostgresCoordinatorWorkflow {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[derive(FromRow)]
struct CoordinatorRow {
    organization_id: Uuid,
    user_id: Uuid,
    email: String,
    first_name: String,
    last_name: String,
    is_active: bool,
}

impl From<CoordinatorRow> for OrganizationCoordinator {
    fn from(row: CoordinatorRow) -> Self {
        Self {
            organization_id: row.organization_id,
            user_id: row.user_id,
            email: row.email,
            first_name: row.first_name,
            last_name: row.last_name,
            is_active: row.is_active,
        }
    }
}

const SELECT_COORDINATORS: &str = r#"
    SELECT om.organization_id, u.id AS user_id, u.email::text AS email,
           u.first_name, u.last_name, omr.is_active
    FROM organization_members om
    INNER JOIN organization_member_roles omr ON omr.organization_member_id = om.id
    INNER JOIN roles r ON r.id = omr.role_id
    INNER JOIN users u ON u.id = om.user_id
"#;

#[async_trait]
impl CoordinatorWorkflow for PostgresCoordinatorWorkflow {
    async fn add_coordinator(
        &self,
        organization_id: Uuid,
        assigned_by: Uuid,
        email: &str,
        first_name: &str,
        last_name: &str,
        password_hash: &str,
    ) -> Result<(OrganizationCoordinator, bool), AppError> {
        let mut tx = self.pool.begin().await.map_err(db)?;
        let (user_id, account_created) =
            create_staff_user(&mut tx, email, first_name, last_name, password_hash).await?;
        let member_id = ensure_active_member(&mut tx, organization_id, user_id).await?;
        let role_id = coordinator_role_id(&mut tx).await?;
        assign_role(&mut tx, member_id, role_id, assigned_by).await?;
        let coordinator = get_coordinator_in_tx(&mut tx, organization_id, user_id).await?;
        tx.commit().await.map_err(db)?;
        Ok((coordinator, account_created))
    }

    async fn list_coordinators(
        &self,
        organization_id: Uuid,
    ) -> Result<Vec<OrganizationCoordinator>, AppError> {
        let query = format!(
            "{SELECT_COORDINATORS} \
             WHERE om.organization_id = $1 \
               AND r.code = 'ORG_COORDINATOR' AND r.scope = 'ORGANIZATION'::role_scope \
             ORDER BY u.last_name, u.first_name, u.email"
        );
        sqlx::query_as::<_, CoordinatorRow>(&query)
            .bind(organization_id)
            .fetch_all(&self.pool)
            .await
            .map_err(db)
            .map(|rows| {
                rows.into_iter()
                    .map(OrganizationCoordinator::from)
                    .collect()
            })
    }

    async fn get_coordinator(
        &self,
        organization_id: Uuid,
        user_id: Uuid,
    ) -> Result<OrganizationCoordinator, AppError> {
        get_coordinator_from_pool(&self.pool, organization_id, user_id).await
    }

    async fn replace_coordinator(
        &self,
        organization_id: Uuid,
        current_user_id: Uuid,
        assigned_by: Uuid,
        email: &str,
    ) -> Result<OrganizationCoordinator, AppError> {
        let mut tx = self.pool.begin().await.map_err(db)?;

        let exists = sqlx::query_scalar::<_, bool>(
            "SELECT EXISTS (
                SELECT 1 FROM organization_members om
                INNER JOIN organization_member_roles omr ON omr.organization_member_id = om.id
                INNER JOIN roles r ON r.id = omr.role_id
                WHERE om.organization_id = $1 AND om.user_id = $2
                  AND omr.is_active = TRUE
                  AND r.code = 'ORG_COORDINATOR' AND r.scope = 'ORGANIZATION'::role_scope
            )",
        )
        .bind(organization_id)
        .bind(current_user_id)
        .fetch_one(&mut *tx)
        .await
        .map_err(db)?;

        if !exists {
            return Err(AppError::NotFound("coordinator".to_owned()));
        }

        let new_user_id = find_active_user(&mut tx, email).await?;
        let member_id = ensure_active_member(&mut tx, organization_id, new_user_id).await?;
        let role_id = coordinator_role_id(&mut tx).await?;
        assign_role(&mut tx, member_id, role_id, assigned_by).await?;

        if new_user_id != current_user_id {
            remove_coordinator_role(&mut tx, organization_id, current_user_id).await?;
            deactivate_membership_if_unassigned(&mut tx, organization_id, current_user_id).await?;
        }

        let coordinator = get_coordinator_in_tx(&mut tx, organization_id, new_user_id).await?;
        tx.commit().await.map_err(db)?;
        Ok(coordinator)
    }

    async fn update_coordinator(
        &self,
        organization_id: Uuid,
        user_id: Uuid,
        first_name: &str,
        last_name: &str,
        email: &str,
    ) -> Result<OrganizationCoordinator, AppError> {
        let is_coordinator = sqlx::query_scalar::<_, bool>(
            "SELECT EXISTS (
                SELECT 1 FROM organization_members om
                INNER JOIN organization_member_roles omr ON omr.organization_member_id = om.id
                INNER JOIN roles r ON r.id = omr.role_id
                WHERE om.organization_id = $1 AND om.user_id = $2
                  AND r.code = 'ORG_COORDINATOR' AND r.scope = 'ORGANIZATION'::role_scope
                  AND omr.is_active = TRUE
                  AND om.is_active = TRUE
            )",
        )
        .bind(organization_id)
        .bind(user_id)
        .fetch_one(&self.pool)
        .await
        .map_err(db)?;

        if !is_coordinator {
            return Err(AppError::NotFound("coordinator".to_owned()));
        }

        sqlx::query(
            "UPDATE users SET first_name = $1, last_name = $2, email = $3, updated_at = now()
             WHERE id = $4 AND status = 'ACTIVE'::user_account_status",
        )
        .bind(first_name.trim())
        .bind(last_name.trim())
        .bind(email.trim())
        .bind(user_id)
        .execute(&self.pool)
        .await
        .map_err(db)?;

        get_coordinator_from_pool(&self.pool, organization_id, user_id).await
    }

    async fn update_coordinator_password(
        &self,
        organization_id: Uuid,
        user_id: Uuid,
        password_hash: &str,
    ) -> Result<(), AppError> {
        let is_coordinator = sqlx::query_scalar::<_, bool>(
            "SELECT EXISTS (
                SELECT 1 FROM organization_members om
                INNER JOIN organization_member_roles omr ON omr.organization_member_id = om.id
                INNER JOIN roles r ON r.id = omr.role_id
                WHERE om.organization_id = $1 AND om.user_id = $2
                  AND r.code = 'ORG_COORDINATOR' AND r.scope = 'ORGANIZATION'::role_scope
                  AND omr.is_active = TRUE
                  AND om.is_active = TRUE
            )",
        )
        .bind(organization_id)
        .bind(user_id)
        .fetch_one(&self.pool)
        .await
        .map_err(db)?;

        if !is_coordinator {
            return Err(AppError::NotFound("coordinator".to_owned()));
        }

        sqlx::query(
            "UPDATE users SET password_hash = $1, must_change_password = TRUE, updated_at = now() WHERE id = $2",
        )
        .bind(password_hash)
        .bind(user_id)
        .execute(&self.pool)
        .await
        .map_err(db)?;

        Ok(())
    }

    async fn remove_coordinator(
        &self,
        organization_id: Uuid,
        user_id: Uuid,
    ) -> Result<(), AppError> {
        let mut tx = self.pool.begin().await.map_err(db)?;
        remove_coordinator_role(&mut tx, organization_id, user_id).await?;
        deactivate_membership_if_unassigned(&mut tx, organization_id, user_id).await?;
        tx.commit().await.map_err(db)
    }

    async fn set_coordinator_active(
        &self,
        organization_id: Uuid,
        user_id: Uuid,
        is_active: bool,
    ) -> Result<(), AppError> {
        let mut tx = self.pool.begin().await.map_err(db)?;
        let updated = sqlx::query_scalar::<_, Uuid>(
            "UPDATE organization_member_roles omr SET is_active = $3 \
             FROM organization_members om, roles r \
             WHERE omr.organization_member_id = om.id AND omr.role_id = r.id \
               AND om.organization_id = $1 AND om.user_id = $2 \
               AND r.code = 'ORG_COORDINATOR' AND r.scope = 'ORGANIZATION'::role_scope \
               AND omr.is_active <> $3 RETURNING om.user_id",
        )
        .bind(organization_id)
        .bind(user_id)
        .bind(is_active)
        .fetch_optional(&mut *tx)
        .await
        .map_err(db)?;
        if updated.is_none() {
            return Err(AppError::NotFound("coordinator assignment".to_owned()));
        }
        if is_active {
            sqlx::query(
                "UPDATE organization_members SET is_active = TRUE, updated_at = now() \
                 WHERE organization_id = $1 AND user_id = $2",
            )
            .bind(organization_id)
            .bind(user_id)
            .execute(&mut *tx)
            .await
            .map_err(db)?;
        } else {
            deactivate_membership_if_unassigned(&mut tx, organization_id, user_id).await?;
        }
        tx.commit().await.map_err(db)
    }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

fn db(e: sqlx::Error) -> AppError {
    AppError::Database(Box::new(e))
}

async fn create_staff_user(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    email: &str,
    first_name: &str,
    last_name: &str,
    password_hash: &str,
) -> Result<(Uuid, bool), AppError> {
    let inserted = sqlx::query_scalar::<_, Uuid>(
        "INSERT INTO users (id, email, password_hash, first_name, last_name, status, email_verified_at, must_change_password)
         VALUES ($1, $2, $3, $4, $5, 'ACTIVE'::user_account_status, now(), TRUE)
         ON CONFLICT (email) DO NOTHING RETURNING id",
    )
    .bind(Uuid::new_v4())
    .bind(email)
    .bind(password_hash)
    .bind(first_name.trim())
    .bind(last_name.trim())
    .fetch_optional(&mut **tx)
    .await
    .map_err(db)?;

    if let Some(id) = inserted {
        return Ok((id, true));
    }

    let existing = sqlx::query_scalar::<_, Uuid>(
        "SELECT id FROM users WHERE email = $1 AND status = 'ACTIVE'::user_account_status",
    )
    .bind(email)
    .fetch_optional(&mut **tx)
    .await
    .map_err(db)?
    .ok_or(AppError::EmailTaken)?;

    Ok((existing, false))
}

async fn find_active_user(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    email: &str,
) -> Result<Uuid, AppError> {
    sqlx::query_scalar::<_, Uuid>(
        "SELECT id FROM users WHERE email = $1 AND status = 'ACTIVE'::user_account_status",
    )
    .bind(email)
    .fetch_optional(&mut **tx)
    .await
    .map_err(db)?
    .ok_or_else(|| AppError::NotFound("active user for email".to_owned()))
}

async fn ensure_active_member(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    organization_id: Uuid,
    user_id: Uuid,
) -> Result<Uuid, AppError> {
    sqlx::query_scalar::<_, Uuid>(
        "INSERT INTO organization_members (organization_id, user_id)
         VALUES ($1, $2)
         ON CONFLICT (organization_id, user_id)
         DO UPDATE SET is_active = TRUE, updated_at = now()
         RETURNING id",
    )
    .bind(organization_id)
    .bind(user_id)
    .fetch_one(&mut **tx)
    .await
    .map_err(db)
}

async fn coordinator_role_id(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
) -> Result<Uuid, AppError> {
    sqlx::query_scalar::<_, Uuid>(
        "SELECT id FROM roles
         WHERE code = 'ORG_COORDINATOR'
           AND scope = 'ORGANIZATION'::role_scope
           AND is_active = TRUE",
    )
    .fetch_optional(&mut **tx)
    .await
    .map_err(db)?
    .ok_or_else(|| AppError::Configuration("ORG_COORDINATOR role is not configured".to_owned()))
}

async fn assign_role(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    member_id: Uuid,
    role_id: Uuid,
    assigned_by: Uuid,
) -> Result<(), AppError> {
    sqlx::query(
        "INSERT INTO organization_member_roles (organization_member_id, role_id, assigned_by)
         VALUES ($1, $2, $3)
         ON CONFLICT (organization_member_id, role_id)
         DO UPDATE SET assigned_by = EXCLUDED.assigned_by, is_active = TRUE",
    )
    .bind(member_id)
    .bind(role_id)
    .bind(assigned_by)
    .execute(&mut **tx)
    .await
    .map_err(db)?;
    Ok(())
}

async fn get_coordinator_in_tx(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    organization_id: Uuid,
    user_id: Uuid,
) -> Result<OrganizationCoordinator, AppError> {
    let query = format!(
        "{SELECT_COORDINATORS}
         WHERE om.organization_id = $1 AND om.user_id = $2
           AND r.code = 'ORG_COORDINATOR' AND r.scope = 'ORGANIZATION'::role_scope"
    );
    sqlx::query_as::<_, CoordinatorRow>(&query)
        .bind(organization_id)
        .bind(user_id)
        .fetch_optional(&mut **tx)
        .await
        .map_err(db)?
        .map(OrganizationCoordinator::from)
        .ok_or_else(|| AppError::NotFound("coordinator".to_owned()))
}

async fn get_coordinator_from_pool(
    pool: &PgPool,
    organization_id: Uuid,
    user_id: Uuid,
) -> Result<OrganizationCoordinator, AppError> {
    let query = format!(
        "{SELECT_COORDINATORS}
         WHERE om.organization_id = $1 AND om.user_id = $2 AND om.is_active = TRUE AND omr.is_active = TRUE
           AND r.code = 'ORG_COORDINATOR' AND r.scope = 'ORGANIZATION'::role_scope"
    );
    sqlx::query_as::<_, CoordinatorRow>(&query)
        .bind(organization_id)
        .bind(user_id)
        .fetch_optional(pool)
        .await
        .map_err(db)?
        .map(OrganizationCoordinator::from)
        .ok_or_else(|| AppError::NotFound("coordinator".to_owned()))
}

async fn remove_coordinator_role(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    organization_id: Uuid,
    user_id: Uuid,
) -> Result<(), AppError> {
    sqlx::query_scalar::<_, Uuid>(
        "DELETE FROM organization_member_roles omr
         USING organization_members om, roles r
         WHERE omr.organization_member_id = om.id
           AND omr.role_id = r.id
           AND om.organization_id = $1 AND om.user_id = $2
           AND r.code = 'ORG_COORDINATOR' AND r.scope = 'ORGANIZATION'::role_scope
         RETURNING om.user_id",
    )
    .bind(organization_id)
    .bind(user_id)
    .fetch_optional(&mut **tx)
    .await
    .map_err(db)?
    .map(|_| ())
    .ok_or_else(|| AppError::NotFound("coordinator".to_owned()))
}

async fn deactivate_membership_if_unassigned(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    organization_id: Uuid,
    user_id: Uuid,
) -> Result<(), AppError> {
    sqlx::query(
        "UPDATE organization_members om
         SET is_active = FALSE, updated_at = now()
         WHERE om.organization_id = $1 AND om.user_id = $2
           AND NOT EXISTS (
               SELECT 1 FROM organization_member_roles omr
               WHERE omr.organization_member_id = om.id
                 AND omr.is_active = TRUE
           )
           AND NOT EXISTS (
               SELECT 1 FROM pageant_member_roles pmr
               INNER JOIN pageants p ON p.id = pmr.pageant_id
               WHERE p.organization_id = om.organization_id
                 AND pmr.user_id = om.user_id AND pmr.is_active = TRUE
           )",
    )
    .bind(organization_id)
    .bind(user_id)
    .execute(&mut **tx)
    .await
    .map_err(db)?;
    Ok(())
}
