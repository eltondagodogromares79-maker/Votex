use async_trait::async_trait;
use sqlx::PgPool;
use uuid::Uuid;

use core_infra::AppError;

use crate::application::ports::user_role_workflow::UserRoleWorkflow;

pub struct PostgresUserRoleWorkflow {
    pool: PgPool,
}

impl PostgresUserRoleWorkflow {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl UserRoleWorkflow for PostgresUserRoleWorkflow {
    async fn resolve_primary_role(&self, user_id: Uuid) -> Result<String, AppError> {
        // ── 1. Platform admin (SYSTEM scope) ─────────────────────────────────
        let is_admin: bool = sqlx::query_scalar(
            r#"
            SELECT EXISTS (
                SELECT 1
                FROM user_system_roles usr
                INNER JOIN roles r ON r.id = usr.role_id
                WHERE usr.user_id = $1
                  AND r.scope = 'SYSTEM'::role_scope
                  AND r.is_active = TRUE
            )
            "#,
        )
        .bind(user_id)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| AppError::Database(Box::new(e)))?;

        if is_admin {
            return Ok("admin".to_string());
        }

        // ── 2 & 3. Organization roles (ORGANIZATION scope) ───────────────────
        let org_role: Option<String> = sqlx::query_scalar(
            r#"
            SELECT r.code
            FROM organization_members om
            INNER JOIN organization_member_roles omr ON omr.organization_member_id = om.id
            INNER JOIN roles r ON r.id = omr.role_id
            WHERE om.user_id = $1
              AND om.is_active = TRUE
              AND r.scope = 'ORGANIZATION'::role_scope
              AND r.is_active = TRUE
              AND r.code IN ('ORG_OWNER', 'ORG_COORDINATOR')
            ORDER BY
                CASE r.code
                    WHEN 'ORG_OWNER'       THEN 1
                    WHEN 'ORG_COORDINATOR' THEN 2
                    ELSE 99
                END
            LIMIT 1
            "#,
        )
        .bind(user_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| AppError::Database(Box::new(e)))?;

        if let Some(code) = org_role {
            return Ok(match code.as_str() {
                "ORG_OWNER"       => "org_owner".to_string(),
                "ORG_COORDINATOR" => "coordinator".to_string(),
                _                 => "coordinator".to_string(),
            });
        }

        // ── 4 & 5. Pageant roles (PAGEANT scope) ─────────────────────────────
        let pageant_role: Option<String> = sqlx::query_scalar(
            r#"
            SELECT r.code
            FROM pageant_member_roles pmr
            INNER JOIN roles r ON r.id = pmr.role_id
            WHERE pmr.user_id = $1
              AND pmr.is_active = TRUE
              AND r.scope = 'PAGEANT'::role_scope
              AND r.is_active = TRUE
              AND r.code IN ('PAGEANT_JUDGE', 'PAGEANT_TABULATOR')
            ORDER BY
                CASE r.code
                    WHEN 'PAGEANT_JUDGE'      THEN 1
                    WHEN 'PAGEANT_TABULATOR'  THEN 2
                    ELSE 99
                END
            LIMIT 1
            "#,
        )
        .bind(user_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| AppError::Database(Box::new(e)))?;

        if let Some(code) = pageant_role {
            return Ok(match code.as_str() {
                "PAGEANT_JUDGE"     => "judge".to_string(),
                "PAGEANT_TABULATOR" => "tabulator".to_string(),
                _                   => "audience".to_string(),
            });
        }

        // ── 6. Audience voter ─────────────────────────────────────────────────
        let is_audience: bool = sqlx::query_scalar(
            r#"
            SELECT EXISTS (
                SELECT 1 FROM audience_voters WHERE user_id = $1
            )
            "#,
        )
        .bind(user_id)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| AppError::Database(Box::new(e)))?;

        if is_audience {
            return Ok("audience".to_string());
        }

        Err(AppError::NotFound("user role".to_string()))
    }
}
