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
    pageant_id: Uuid,
    pageant_name: String,
    pageant_slug: String,
    user_id: Uuid,
    email: String,
    first_name: String,
    last_name: String,
    is_active: bool,
}

impl PageantStaffRow {
    fn into_member(self, role: PageantStaffRole) -> PageantStaffMember {
        PageantStaffMember {
            pageant_id: self.pageant_id,
            pageant_name: self.pageant_name,
            pageant_slug: self.pageant_slug,
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
        confirm_cross_organization_reuse: bool,
    ) -> Result<(PageantStaffMember, bool), AppError> {
        let mut transaction = self.pool.begin().await.map_err(database_error)?;

        if role != PageantStaffRole::Coordinator {
            sqlx::query_scalar::<_, Uuid>("SELECT id FROM organizations WHERE id = $1 FOR UPDATE")
                .bind(organization_id)
                .fetch_optional(&mut *transaction)
                .await
                .map_err(database_error)?
                .ok_or_else(|| AppError::NotFound("organization".to_owned()))?;
        }

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

        if matches!(role, PageantStaffRole::Judge | PageantStaffRole::Tabulator) {
            let max_limit = match role {
                PageantStaffRole::Judge => "max_judges_per_pageant",
                PageantStaffRole::Tabulator => "max_tabulator_users",
                PageantStaffRole::Coordinator => unreachable!(),
            };
            let query = format!(
                "SELECT plan.{max_limit} FROM organization_subscriptions subscription \
                 INNER JOIN subscription_plans plan ON plan.id = subscription.plan_id \
                 WHERE subscription.organization_id = $1 \
                   AND subscription.status IN ('TRIALING','ACTIVE','PAST_DUE','PAUSED') \
                 ORDER BY subscription.created_at DESC, subscription.id DESC LIMIT 1"
            );
            let max_limit = sqlx::query_scalar::<_, Option<i32>>(&query)
                .bind(organization_id)
                .fetch_optional(&mut *transaction)
                .await
                .map_err(database_error)?
                .ok_or_else(|| AppError::BadRequest(
                    "Your organization does not have an active subscription. Please subscribe to a plan before assigning judges or tabulators.".to_owned(),
                ))?;

            if let Some(max) = max_limit {
                let target_already_active = if role == PageantStaffRole::Judge {
                    sqlx::query_scalar::<_, bool>(
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
                    .map_err(database_error)?
                } else {
                    sqlx::query_scalar::<_, bool>(
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
                    .map_err(database_error)?
                };

                if !target_already_active {
                    let current_count = if role == PageantStaffRole::Judge {
                        sqlx::query_scalar::<_, i64>(
                            "SELECT COUNT(DISTINCT assignment.user_id) FROM pageant_member_roles assignment \
                             INNER JOIN roles assigned_role ON assigned_role.id = assignment.role_id \
                             WHERE assignment.pageant_id = $1 AND assignment.is_active = TRUE \
                               AND assigned_role.code = 'PAGEANT_JUDGE' \
                               AND assigned_role.scope = 'PAGEANT'::role_scope AND assigned_role.is_active = TRUE",
                        )
                        .bind(pageant_id)
                        .fetch_one(&mut *transaction)
                        .await
                        .map_err(database_error)?
                    } else {
                        sqlx::query_scalar::<_, i64>(
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
                        .map_err(database_error)?
                    };
                    if current_count >= i64::from(max) {
                        let resource = if role == PageantStaffRole::Judge {
                            "judges for this pageant"
                        } else {
                            "tabulator users for your organization"
                        };
                        return Err(AppError::BadRequest(format!(
                            "Your current plan allows a maximum of {max} {resource}. You have reached this limit. Please upgrade your plan to assign more."
                        )));
                    }
                }
            }
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
            let inserted=sqlx::query_scalar::<_,Uuid>("INSERT INTO users (id,email,password_hash,first_name,last_name,status,email_verified_at,must_change_password) VALUES ($1,$2,$3,$4,$5,'ACTIVE'::user_account_status,now(),TRUE) ON CONFLICT (email) DO NOTHING RETURNING id")
                .bind(Uuid::new_v4()).bind(email).bind(password_hash).bind(first_name.trim()).bind(last_name.trim())
                .fetch_optional(&mut *transaction).await.map_err(database_error)?;
            match inserted {
                Some(id) => (id, true),
                None => {
                    let id=sqlx::query_scalar::<_,Uuid>("SELECT id FROM users WHERE email=$1 AND status='ACTIVE'::user_account_status FOR UPDATE")
                    .bind(email).fetch_optional(&mut *transaction).await.map_err(database_error)?.ok_or(AppError::EmailTaken)?;
                    (id, false)
                }
            }
        };

        if matches!(role, PageantStaffRole::Judge | PageantStaffRole::Tabulator) {
            let opposite_role = match role {
                PageantStaffRole::Judge => "PAGEANT_TABULATOR",
                PageantStaffRole::Tabulator => "PAGEANT_JUDGE",
                PageantStaffRole::Coordinator => unreachable!(),
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
            .bind(match role {
                PageantStaffRole::Judge => "PAGEANT_JUDGE",
                PageantStaffRole::Tabulator => "PAGEANT_TABULATOR",
                PageantStaffRole::Coordinator => unreachable!(),
            })
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
        }

        if role == PageantStaffRole::Coordinator {
            let is_organization_coordinator = sqlx::query_scalar::<_, bool>(
                r#"
                SELECT EXISTS (
                    SELECT 1
                    FROM organization_members om
                    INNER JOIN organization_member_roles omr ON omr.organization_member_id = om.id
                    INNER JOIN roles organization_role ON organization_role.id = omr.role_id
                    WHERE om.organization_id = $1 AND om.user_id = $2 AND om.is_active = TRUE
                      AND omr.is_active = TRUE
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
            SELECT pmr.pageant_id, p.name AS pageant_name, p.slug AS pageant_slug,
                   u.id AS user_id, u.email::text AS email, u.first_name, u.last_name,
                   pmr.is_active
            FROM pageant_member_roles pmr
            INNER JOIN pageants p ON p.id = pmr.pageant_id
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
            SELECT pmr.pageant_id, p.name AS pageant_name, p.slug AS pageant_slug,
                   u.id AS user_id, u.email::text AS email, u.first_name, u.last_name,
                   pmr.is_active
            FROM pageant_member_roles pmr
            INNER JOIN pageants p ON p.id = pmr.pageant_id
            INNER JOIN roles r ON r.id = pmr.role_id
            INNER JOIN users u ON u.id = pmr.user_id
            WHERE p.organization_id = $1
              AND p.id = $2
              AND r.code = $3
              AND r.is_active = TRUE
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

    async fn activate(
        &self,
        organization_id: Uuid,
        pageant_id: Uuid,
        user_id: Uuid,
        role: PageantStaffRole,
    ) -> Result<(), AppError> {
        let mut transaction = self.pool.begin().await.map_err(database_error)?;
        if matches!(role, PageantStaffRole::Judge | PageantStaffRole::Tabulator) {
            sqlx::query_scalar::<_, Uuid>("SELECT id FROM organizations WHERE id = $1 FOR UPDATE")
                .bind(organization_id)
                .fetch_optional(&mut *transaction)
                .await
                .map_err(database_error)?
                .ok_or_else(|| AppError::NotFound("organization".to_owned()))?;
            let (limit_column, role_code, scope) = match role {
                PageantStaffRole::Judge => ("max_judges_per_pageant", "PAGEANT_JUDGE", "pageant"),
                PageantStaffRole::Tabulator => {
                    ("max_tabulator_users", "PAGEANT_TABULATOR", "organization")
                }
                PageantStaffRole::Coordinator => unreachable!(),
            };
            let sql = format!(
                "SELECT plan.{limit_column} FROM organization_subscriptions subscription \
                 INNER JOIN subscription_plans plan ON plan.id = subscription.plan_id \
                 WHERE subscription.organization_id = $1 \
                   AND subscription.status IN ('TRIALING','ACTIVE','PAST_DUE','PAUSED') \
                 ORDER BY subscription.created_at DESC, subscription.id DESC LIMIT 1"
            );
            let maximum = sqlx::query_scalar::<_, Option<i32>>(&sql)
                .bind(organization_id)
                .fetch_optional(&mut *transaction)
                .await
                .map_err(database_error)?
                .ok_or_else(|| AppError::BadRequest("Your organization does not have an active subscription. Please subscribe to a plan before activating staff assignments.".to_owned()))?;
            if let Some(maximum) = maximum {
                let count_sql = if scope == "pageant" {
                    format!(
                        "SELECT COUNT(DISTINCT pmr.user_id) FROM pageant_member_roles pmr \
                         INNER JOIN roles r ON r.id = pmr.role_id WHERE pmr.pageant_id = $1 \
                           AND pmr.is_active = TRUE AND r.code = '{role_code}' \
                           AND r.scope = 'PAGEANT'::role_scope AND r.is_active = TRUE"
                    )
                } else {
                    format!(
                        "SELECT COUNT(DISTINCT pmr.user_id) FROM pageant_member_roles pmr \
                         INNER JOIN pageants p ON p.id = pmr.pageant_id \
                         INNER JOIN roles r ON r.id = pmr.role_id WHERE p.organization_id = $1 \
                           AND p.status <> 'ARCHIVED'::pageant_status AND pmr.is_active = TRUE \
                           AND r.code = '{role_code}' AND r.scope = 'PAGEANT'::role_scope AND r.is_active = TRUE"
                    )
                };
                let count = sqlx::query_scalar::<_, i64>(&count_sql)
                    .bind(if scope == "pageant" {
                        pageant_id
                    } else {
                        organization_id
                    })
                    .fetch_one(&mut *transaction)
                    .await
                    .map_err(database_error)?;
                if count >= i64::from(maximum) {
                    let resource = if scope == "pageant" {
                        "judges for this pageant"
                    } else {
                        "tabulator users for your organization"
                    };
                    return Err(AppError::BadRequest(format!(
                        "Your current plan allows a maximum of {maximum} {resource}. You have reached this limit."
                    )));
                }
            }
        }

        let updated = sqlx::query_scalar::<_, Uuid>(
            "UPDATE pageant_member_roles pmr SET is_active = TRUE \
             FROM pageants p, roles r WHERE pmr.pageant_id = p.id \
               AND p.organization_id = $1 AND p.id = $2 AND pmr.user_id = $3 \
               AND pmr.role_id = r.id AND r.code = $4 \
               AND r.scope = 'PAGEANT'::role_scope AND r.is_active = TRUE \
               AND pmr.is_active = FALSE RETURNING pmr.user_id",
        )
        .bind(organization_id)
        .bind(pageant_id)
        .bind(user_id)
        .bind(role.role_code())
        .fetch_optional(&mut *transaction)
        .await
        .map_err(database_error)?;
        updated.ok_or_else(|| AppError::NotFound("inactive pageant assignment".to_owned()))?;
        transaction.commit().await.map_err(database_error)
    }

    async fn delete_assignment(
        &self,
        organization_id: Uuid,
        pageant_id: Uuid,
        user_id: Uuid,
        role: PageantStaffRole,
    ) -> Result<(), AppError> {
        let deleted = sqlx::query_scalar::<_, Uuid>(
            "DELETE FROM pageant_member_roles pmr USING pageants p, roles r \
             WHERE pmr.pageant_id = p.id AND p.organization_id = $1 AND p.id = $2 \
               AND pmr.user_id = $3 AND pmr.role_id = r.id AND r.code = $4 \
               AND r.scope = 'PAGEANT'::role_scope AND r.is_active = TRUE \
             RETURNING pmr.user_id",
        )
        .bind(organization_id)
        .bind(pageant_id)
        .bind(user_id)
        .bind(role.role_code())
        .fetch_optional(&self.pool)
        .await
        .map_err(database_error)?;
        deleted
            .map(|_| ())
            .ok_or_else(|| AppError::NotFound("pageant staff assignment".to_owned()))
    }
}

fn database_error(error: sqlx::Error) -> AppError {
    AppError::Database(Box::new(error))
}
