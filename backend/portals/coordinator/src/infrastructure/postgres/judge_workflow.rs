use async_trait::async_trait;
use core_infra::AppError;
use sqlx::{FromRow, PgPool};
use uuid::Uuid;

use crate::{
    application::ports::judge_workflow::JudgeWorkflow,
    domain::judge::{PageantJudge, PageantStaffRole},
    infrastructure::postgres::entitlements::{ensure_below_limit, lock_org_and_get_limits},
};

pub struct PostgresJudgeWorkflow {
    pool: PgPool,
}

impl PostgresJudgeWorkflow {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[derive(FromRow)]
struct JudgeRow {
    pageant_id: Uuid,
    pageant_name: String,
    pageant_slug: String,
    user_id: Uuid,
    email: String,
    first_name: String,
    last_name: String,
    is_active: bool,
    role_code: String,
}

impl From<JudgeRow> for PageantJudge {
    fn from(row: JudgeRow) -> Self {
        Self {
            pageant_id: row.pageant_id,
            pageant_name: row.pageant_name,
            pageant_slug: row.pageant_slug,
            user_id: row.user_id,
            email: row.email,
            first_name: row.first_name,
            last_name: row.last_name,
            is_active: row.is_active,
            role: if row.role_code == "PAGEANT_TABULATOR" {
                PageantStaffRole::Tabulator
            } else {
                PageantStaffRole::Judge
            },
        }
    }
}

#[async_trait]
impl JudgeWorkflow for PostgresJudgeWorkflow {
    async fn list(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
        role: PageantStaffRole,
    ) -> Result<Vec<PageantJudge>, AppError> {
        let has_assignment =
            coordinator_has_pageant_assignment(&self.pool, coordinator_id, pageant_id).await?;
        if !has_assignment {
            return Err(AppError::Forbidden);
        }

        let rows = sqlx::query_as::<_, JudgeRow>(
            r#"
            SELECT assignment.pageant_id, pageant.name AS pageant_name, pageant.slug AS pageant_slug,
                   user_account.id AS user_id,
                   user_account.email::text AS email, user_account.first_name,
                   user_account.last_name, assignment.is_active, judge_role.code AS role_code
            FROM pageant_member_roles assignment
            INNER JOIN pageants pageant ON pageant.id = assignment.pageant_id
            INNER JOIN roles judge_role ON judge_role.id = assignment.role_id
            INNER JOIN users user_account ON user_account.id = assignment.user_id
            WHERE assignment.pageant_id = $1
              AND judge_role.code = $2
              AND judge_role.scope = 'PAGEANT'::role_scope
              AND judge_role.is_active = TRUE
            ORDER BY user_account.last_name, user_account.first_name, user_account.email
            "#,
        )
        .bind(pageant_id)
        .bind(role.as_db_code())
        .fetch_all(&self.pool)
        .await
        .map_err(database_error)?;
        Ok(rows.into_iter().map(PageantJudge::from).collect())
    }

    async fn assign(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
        assigned_by: Uuid,
        email: &str,
        first_name: &str,
        last_name: &str,
        password_hash: &str,
        role: PageantStaffRole,
        confirm_cross_organization_reuse: bool,
    ) -> Result<(PageantJudge, bool), AppError> {
        let mut transaction = self.pool.begin().await.map_err(database_error)?;
        let pageant_exists =
            sqlx::query_scalar::<_, bool>("SELECT EXISTS (SELECT 1 FROM pageants WHERE id = $1)")
                .bind(pageant_id)
                .fetch_one(&mut *transaction)
                .await
                .map_err(database_error)?;
        if !pageant_exists {
            return Err(AppError::NotFound("pageant".to_owned()));
        }
        ensure_coordinator_assignment(&mut transaction, coordinator_id, pageant_id).await?;

        let organization_id =
            sqlx::query_scalar::<_, Uuid>("SELECT organization_id FROM pageants WHERE id = $1")
                .bind(pageant_id)
                .fetch_one(&mut *transaction)
                .await
                .map_err(database_error)?;

        let limits = lock_org_and_get_limits(&mut transaction, coordinator_id, pageant_id).await?;
        let (max_limit, resource, target_already_counted, current_count) = match role {
            PageantStaffRole::Judge => {
                let already_assigned = sqlx::query_scalar::<_, bool>(
                    "SELECT EXISTS (SELECT 1 FROM users user_account \
                     INNER JOIN pageant_member_roles assignment ON assignment.user_id = user_account.id \
                     INNER JOIN roles assigned_role ON assigned_role.id = assignment.role_id \
                     WHERE user_account.email = $1 AND assignment.pageant_id = $2 \
                       AND assignment.is_active = TRUE AND assigned_role.code = 'PAGEANT_JUDGE' \
                       AND assigned_role.scope = 'PAGEANT'::role_scope AND assigned_role.is_active = TRUE)",
                )
                .bind(email)
                .bind(pageant_id)
                .fetch_one(&mut *transaction)
                .await
                .map_err(database_error)?;
                let count = sqlx::query_scalar::<_, i64>(
                    "SELECT COUNT(DISTINCT assignment.user_id) FROM pageant_member_roles assignment \
                     INNER JOIN roles assigned_role ON assigned_role.id = assignment.role_id \
                     WHERE assignment.pageant_id = $1 AND assignment.is_active = TRUE \
                       AND assigned_role.code = 'PAGEANT_JUDGE' \
                       AND assigned_role.scope = 'PAGEANT'::role_scope AND assigned_role.is_active = TRUE",
                )
                .bind(pageant_id)
                .fetch_one(&mut *transaction)
                .await
                .map_err(database_error)?;
                (
                    limits.max_judges_per_pageant,
                    "judges for this pageant",
                    already_assigned,
                    count,
                )
            }
            PageantStaffRole::Tabulator => {
                let already_assigned = sqlx::query_scalar::<_, bool>(
                    "SELECT EXISTS (SELECT 1 FROM users user_account \
                     INNER JOIN pageant_member_roles assignment ON assignment.user_id = user_account.id \
                     INNER JOIN pageants assigned_pageant ON assigned_pageant.id = assignment.pageant_id \
                     INNER JOIN roles assigned_role ON assigned_role.id = assignment.role_id \
                     WHERE user_account.email = $1 AND assigned_pageant.organization_id = $2 \
                       AND assigned_pageant.status <> 'ARCHIVED'::pageant_status \
                       AND assignment.is_active = TRUE AND assigned_role.code = 'PAGEANT_TABULATOR' \
                       AND assigned_role.scope = 'PAGEANT'::role_scope AND assigned_role.is_active = TRUE)",
                )
                .bind(email)
                .bind(organization_id)
                .fetch_one(&mut *transaction)
                .await
                .map_err(database_error)?;
                let count = sqlx::query_scalar::<_, i64>(
                    "SELECT COUNT(DISTINCT assignment.user_id) FROM pageant_member_roles assignment \
                     INNER JOIN pageants assigned_pageant ON assigned_pageant.id = assignment.pageant_id \
                     INNER JOIN roles assigned_role ON assigned_role.id = assignment.role_id \
                     WHERE assigned_pageant.organization_id = $1 \
                       AND assigned_pageant.status <> 'ARCHIVED'::pageant_status \
                       AND assignment.is_active = TRUE AND assigned_role.code = 'PAGEANT_TABULATOR' \
                       AND assigned_role.scope = 'PAGEANT'::role_scope AND assigned_role.is_active = TRUE",
                )
                .bind(organization_id)
                .fetch_one(&mut *transaction)
                .await
                .map_err(database_error)?;
                (
                    limits.max_tabulator_users,
                    "tabulator users for your organization",
                    already_assigned,
                    count,
                )
            }
        };
        if !target_already_counted {
            ensure_below_limit(current_count, max_limit, resource)?;
        }

        let inserted=sqlx::query_scalar::<_,Uuid>("INSERT INTO users (id,email,password_hash,first_name,last_name,status,email_verified_at,must_change_password) VALUES ($1,$2,$3,$4,$5,'ACTIVE'::user_account_status,now(),TRUE) ON CONFLICT (email) DO NOTHING RETURNING id")
            .bind(Uuid::new_v4()).bind(email).bind(password_hash).bind(first_name.trim()).bind(last_name.trim())
            .fetch_optional(&mut *transaction).await.map_err(database_error)?;
        let (user_id, account_created) = match inserted {
            Some(id) => (id, true),
            None => {
                let id = sqlx::query_scalar::<_, Uuid>(
                    "SELECT id FROM users WHERE email=$1 AND status='ACTIVE'::user_account_status FOR UPDATE",
                )
                .bind(email)
                .fetch_optional(&mut *transaction)
                .await
                .map_err(database_error)?
                .ok_or(AppError::EmailTaken)?;
                (id, false)
            }
        };

        let opposite_role = match role {
            PageantStaffRole::Judge => "PAGEANT_TABULATOR",
            PageantStaffRole::Tabulator => "PAGEANT_JUDGE",
        };
        let already_has_opposite_role = sqlx::query_scalar::<_, bool>(
            "SELECT EXISTS (SELECT 1 FROM pageant_member_roles assignment \
             INNER JOIN roles assigned_role ON assigned_role.id = assignment.role_id \
             WHERE assignment.user_id = $1 AND assignment.is_active = TRUE \
               AND assigned_role.code = $2 AND assigned_role.scope = 'PAGEANT'::role_scope \
               AND assigned_role.is_active = TRUE)",
        )
        .bind(user_id)
        .bind(opposite_role)
        .fetch_one(&mut *transaction)
        .await
        .map_err(database_error)?;
        if already_has_opposite_role {
            let current_role = if role == PageantStaffRole::Judge {
                "judge"
            } else {
                "tabulator"
            };
            let opposite_role_name = if role == PageantStaffRole::Judge {
                "tabulator"
            } else {
                "judge"
            };
            return Err(AppError::BadRequest(format!(
                "This account is already assigned as a {opposite_role_name}. A staff account can be either a judge or a tabulator, not both. Remove the existing assignment or use another email address to add this user as a {current_role}."
            )));
        }

        let cross_organization_role = sqlx::query_scalar::<_, bool>(
            "SELECT EXISTS (SELECT 1 FROM pageant_member_roles assignment \
             INNER JOIN pageants assigned_pageant ON assigned_pageant.id = assignment.pageant_id \
             INNER JOIN roles assigned_role ON assigned_role.id = assignment.role_id \
             WHERE assignment.user_id = $1 AND assignment.is_active = TRUE \
               AND assigned_pageant.organization_id <> $2 \
               AND assigned_role.code = $3 AND assigned_role.scope = 'PAGEANT'::role_scope \
               AND assigned_role.is_active = TRUE) \
             AND NOT EXISTS (SELECT 1 FROM pageant_member_roles local_assignment \
               INNER JOIN pageants local_pageant ON local_pageant.id = local_assignment.pageant_id \
               INNER JOIN roles local_role ON local_role.id = local_assignment.role_id \
               WHERE local_assignment.user_id = $1 AND local_assignment.is_active = TRUE \
                 AND local_pageant.organization_id = $2 AND local_role.code = $3 \
                 AND local_role.scope = 'PAGEANT'::role_scope AND local_role.is_active = TRUE)",
        )
        .bind(user_id)
        .bind(organization_id)
        .bind(role.as_db_code())
        .fetch_one(&mut *transaction)
        .await
        .map_err(database_error)?;
        if cross_organization_role && !confirm_cross_organization_reuse {
            let role_name = if role == PageantStaffRole::Judge {
                "judge"
            } else {
                "tabulator"
            };
            return Err(AppError::StaffAccountCrossOrganization {
                role: role_name.to_owned(),
            });
        }

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

        let judge_role_id = sqlx::query_scalar::<_, Uuid>(
            "SELECT id FROM roles WHERE code = $1 \
             AND scope = 'PAGEANT'::role_scope AND is_active = TRUE",
        )
        .bind(role.as_db_code())
        .fetch_optional(&mut *transaction)
        .await
        .map_err(database_error)?
        .ok_or_else(|| {
            AppError::Configuration("PAGEANT_JUDGE role is not configured".to_owned())
        })?;

        sqlx::query(
            r#"
            INSERT INTO pageant_member_roles (pageant_id, user_id, role_id, assigned_by, is_active)
            VALUES ($1, $2, $3, $4, TRUE)
            ON CONFLICT (pageant_id, user_id, role_id)
            DO UPDATE SET assigned_by = EXCLUDED.assigned_by, is_active = TRUE
            "#,
        )
        .bind(pageant_id)
        .bind(user_id)
        .bind(judge_role_id)
        .bind(assigned_by)
        .execute(&mut *transaction)
        .await
        .map_err(database_error)?;

        let row = sqlx::query_as::<_, JudgeRow>(
            r#"
            SELECT assignment.pageant_id, pageant.name AS pageant_name, pageant.slug AS pageant_slug,
                   user_account.id AS user_id,
                   user_account.email::text AS email, user_account.first_name,
                   user_account.last_name, assignment.is_active, assigned_role.code AS role_code
            FROM pageant_member_roles assignment
            INNER JOIN pageants pageant ON pageant.id = assignment.pageant_id
            INNER JOIN users user_account ON user_account.id = assignment.user_id
            INNER JOIN roles assigned_role ON assigned_role.id=assignment.role_id
            WHERE assignment.pageant_id = $1 AND assignment.user_id = $2
              AND assignment.role_id = $3
            "#,
        )
        .bind(pageant_id)
        .bind(user_id)
        .bind(judge_role_id)
        .fetch_one(&mut *transaction)
        .await
        .map_err(database_error)?;

        transaction.commit().await.map_err(database_error)?;
        Ok((row.into(), account_created))
    }

    async fn revoke(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
        user_id: Uuid,
        role: PageantStaffRole,
    ) -> Result<(), AppError> {
        let mut transaction = self.pool.begin().await.map_err(database_error)?;
        ensure_coordinator_assignment(&mut transaction, coordinator_id, pageant_id).await?;
        let revoked_id = sqlx::query_scalar::<_, Uuid>(
            r#"
            UPDATE pageant_member_roles assignment
            SET is_active = FALSE
            FROM roles judge_role
            WHERE assignment.pageant_id = $1
              AND assignment.user_id = $2
              AND assignment.role_id = judge_role.id
              AND judge_role.code = $3
              AND judge_role.scope = 'PAGEANT'::role_scope
              AND assignment.is_active = TRUE
            RETURNING assignment.id
            "#,
        )
        .bind(pageant_id)
        .bind(user_id)
        .bind(role.as_db_code())
        .fetch_optional(&mut *transaction)
        .await
        .map_err(database_error)?;
        if revoked_id.is_none() {
            return Err(AppError::NotFound(
                "active pageant judge assignment".to_owned(),
            ));
        }
        transaction.commit().await.map_err(database_error)
    }

    async fn activate(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
        user_id: Uuid,
        role: PageantStaffRole,
    ) -> Result<(), AppError> {
        let mut transaction = self.pool.begin().await.map_err(database_error)?;
        ensure_coordinator_assignment(&mut transaction, coordinator_id, pageant_id).await?;
        let limits = lock_org_and_get_limits(&mut transaction, coordinator_id, pageant_id).await?;
        let (count, maximum, resource) = match role {
            PageantStaffRole::Judge => {
                let count = sqlx::query_scalar::<_, i64>(
                    "SELECT COUNT(DISTINCT assignment.user_id) FROM pageant_member_roles assignment \
                     INNER JOIN roles assigned_role ON assigned_role.id = assignment.role_id \
                     WHERE assignment.pageant_id = $1 AND assignment.is_active = TRUE \
                       AND assigned_role.code = 'PAGEANT_JUDGE' \
                       AND assigned_role.scope = 'PAGEANT'::role_scope AND assigned_role.is_active = TRUE",
                ).bind(pageant_id).fetch_one(&mut *transaction).await.map_err(database_error)?;
                (
                    count,
                    limits.max_judges_per_pageant,
                    "judges for this pageant",
                )
            }
            PageantStaffRole::Tabulator => {
                let organization_id = sqlx::query_scalar::<_, Uuid>(
                    "SELECT organization_id FROM pageants WHERE id = $1",
                )
                .bind(pageant_id)
                .fetch_one(&mut *transaction)
                .await
                .map_err(database_error)?;
                let count = sqlx::query_scalar::<_, i64>(
                    "SELECT COUNT(DISTINCT assignment.user_id) FROM pageant_member_roles assignment \
                     INNER JOIN pageants assigned_pageant ON assigned_pageant.id = assignment.pageant_id \
                     INNER JOIN roles assigned_role ON assigned_role.id = assignment.role_id \
                     WHERE assigned_pageant.organization_id = $1 AND assigned_pageant.status <> 'ARCHIVED'::pageant_status \
                       AND assignment.is_active = TRUE AND assigned_role.code = 'PAGEANT_TABULATOR' \
                       AND assigned_role.scope = 'PAGEANT'::role_scope AND assigned_role.is_active = TRUE",
                ).bind(organization_id).fetch_one(&mut *transaction).await.map_err(database_error)?;
                (
                    count,
                    limits.max_tabulator_users,
                    "tabulator users for your organization",
                )
            }
        };
        ensure_below_limit(count, maximum, resource)?;
        let updated = sqlx::query_scalar::<_, Uuid>(
            "UPDATE pageant_member_roles assignment SET is_active = TRUE \
             FROM roles assigned_role WHERE assignment.pageant_id = $1 \
               AND assignment.user_id = $2 AND assignment.role_id = assigned_role.id \
               AND assigned_role.code = $3 AND assigned_role.scope = 'PAGEANT'::role_scope \
               AND assigned_role.is_active = TRUE AND assignment.is_active = FALSE \
             RETURNING assignment.user_id",
        )
        .bind(pageant_id)
        .bind(user_id)
        .bind(role.as_db_code())
        .fetch_optional(&mut *transaction)
        .await
        .map_err(database_error)?;
        if updated.is_none() {
            return Err(AppError::NotFound(
                "inactive pageant staff assignment".to_owned(),
            ));
        }
        transaction.commit().await.map_err(database_error)
    }

    async fn delete_assignment(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
        user_id: Uuid,
        role: PageantStaffRole,
    ) -> Result<(), AppError> {
        let mut transaction = self.pool.begin().await.map_err(database_error)?;
        ensure_coordinator_assignment(&mut transaction, coordinator_id, pageant_id).await?;
        let deleted = sqlx::query_scalar::<_, Uuid>(
            "DELETE FROM pageant_member_roles assignment USING roles assigned_role \
             WHERE assignment.pageant_id = $1 AND assignment.user_id = $2 \
               AND assignment.role_id = assigned_role.id AND assigned_role.code = $3 \
               AND assigned_role.scope = 'PAGEANT'::role_scope AND assigned_role.is_active = TRUE \
             RETURNING assignment.user_id",
        )
        .bind(pageant_id)
        .bind(user_id)
        .bind(role.as_db_code())
        .fetch_optional(&mut *transaction)
        .await
        .map_err(database_error)?;
        if deleted.is_none() {
            return Err(AppError::NotFound("pageant staff assignment".to_owned()));
        }
        transaction.commit().await.map_err(database_error)
    }
}

async fn coordinator_has_pageant_assignment(
    pool: &PgPool,
    coordinator_id: Uuid,
    pageant_id: Uuid,
) -> Result<bool, AppError> {
    sqlx::query_scalar::<_, bool>(
        r#"
        SELECT EXISTS (
            SELECT 1
            FROM pageant_member_roles assignment
            INNER JOIN roles coordinator_role ON coordinator_role.id = assignment.role_id
            WHERE assignment.pageant_id = $1 AND assignment.user_id = $2
              AND assignment.is_active = TRUE
              AND coordinator_role.code = 'PAGEANT_COORDINATOR'
              AND coordinator_role.scope = 'PAGEANT'::role_scope
              AND coordinator_role.is_active = TRUE
        )
        "#,
    )
    .bind(pageant_id)
    .bind(coordinator_id)
    .fetch_one(pool)
    .await
    .map_err(database_error)
}

async fn ensure_coordinator_assignment(
    transaction: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    coordinator_id: Uuid,
    pageant_id: Uuid,
) -> Result<(), AppError> {
    let has_assignment = sqlx::query_scalar::<_, bool>(
        r#"
        SELECT EXISTS (
            SELECT 1
            FROM pageant_member_roles assignment
            INNER JOIN roles coordinator_role ON coordinator_role.id = assignment.role_id
            WHERE assignment.pageant_id = $1 AND assignment.user_id = $2
              AND assignment.is_active = TRUE
              AND coordinator_role.code = 'PAGEANT_COORDINATOR'
              AND coordinator_role.scope = 'PAGEANT'::role_scope
              AND coordinator_role.is_active = TRUE
        )
        "#,
    )
    .bind(pageant_id)
    .bind(coordinator_id)
    .fetch_one(&mut **transaction)
    .await
    .map_err(database_error)?;
    if has_assignment {
        Ok(())
    } else {
        Err(AppError::Forbidden)
    }
}

fn database_error(error: sqlx::Error) -> AppError {
    AppError::Database(Box::new(error))
}
