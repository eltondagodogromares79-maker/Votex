use async_trait::async_trait;
use sqlx::PgPool;
use uuid::Uuid;

use core_infra::AppError;

use crate::application::ports::authorization_workflow::{
    AuthorizationScope, AuthorizationWorkflow,
};

pub struct PostgresAuthorizationWorkflow {
    pool: PgPool,
}

impl PostgresAuthorizationWorkflow {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl AuthorizationWorkflow for PostgresAuthorizationWorkflow {
    async fn has_permission(
        &self,
        user_id: Uuid,
        scope: AuthorizationScope,
        permission: &str,
    ) -> Result<bool, AppError> {
        match scope {
            AuthorizationScope::System => self.has_system_permission(user_id, permission).await,

            AuthorizationScope::Organization { organization_id } => {
                self.has_organization_permission(user_id, organization_id, permission)
                    .await
            }

            AuthorizationScope::Pageant { pageant_id } => {
                self.has_pageant_permission(user_id, pageant_id, permission)
                    .await
            }
        }
    }
}

impl PostgresAuthorizationWorkflow {
    async fn has_system_permission(
        &self,
        user_id: Uuid,
        permission: &str,
    ) -> Result<bool, AppError> {
        let exists = sqlx::query_scalar!(
            r#"
            SELECT EXISTS (
                SELECT 1
                FROM user_system_roles usr
                INNER JOIN roles r
                    ON r.id = usr.role_id
                INNER JOIN role_permissions rp
                    ON rp.role_id = r.id
                INNER JOIN permissions p
                    ON p.id = rp.permission_id
                WHERE usr.user_id = $1
                  AND r.scope = 'SYSTEM'
                  AND r.is_active = TRUE
                  AND p.code = $2
            ) AS "exists!"
            "#,
            user_id,
            permission
        )
        .fetch_one(&self.pool)
        .await
        .map_err(|error| AppError::Database(Box::new(error)))?;

        Ok(exists)
    }

    async fn has_organization_permission(
        &self,
        user_id: Uuid,
        organization_id: Uuid,
        permission: &str,
    ) -> Result<bool, AppError> {
        let exists = sqlx::query_scalar!(
            r#"
            SELECT EXISTS (
                SELECT 1
                FROM organization_members om
                INNER JOIN organization_member_roles omr
                    ON omr.organization_member_id = om.id
                INNER JOIN roles r
                    ON r.id = omr.role_id
                INNER JOIN role_permissions rp
                    ON rp.role_id = r.id
                INNER JOIN permissions p
                    ON p.id = rp.permission_id
                WHERE om.user_id = $1
                  AND om.organization_id = $2
                  AND om.is_active = TRUE
                  AND r.scope = 'ORGANIZATION'
                  AND r.is_active = TRUE
                  AND p.code = $3
            ) AS "exists!"
            "#,
            user_id,
            organization_id,
            permission
        )
        .fetch_one(&self.pool)
        .await
        .map_err(|error| AppError::Database(Box::new(error)))?;

        Ok(exists)
    }

    async fn has_pageant_permission(
        &self,
        user_id: Uuid,
        pageant_id: Uuid,
        permission: &str,
    ) -> Result<bool, AppError> {
        let exists = sqlx::query_scalar!(
            r#"
            SELECT EXISTS (
                SELECT 1
                FROM pageant_member_roles pmr
                INNER JOIN roles r
                    ON r.id = pmr.role_id
                INNER JOIN role_permissions rp
                    ON rp.role_id = r.id
                INNER JOIN permissions p
                    ON p.id = rp.permission_id
                WHERE pmr.user_id = $1
                  AND pmr.pageant_id = $2
                  AND pmr.is_active = TRUE
                  AND r.scope = 'PAGEANT'
                  AND r.is_active = TRUE
                  AND p.code = $3
            ) AS "exists!"
            "#,
            user_id,
            pageant_id,
            permission
        )
        .fetch_one(&self.pool)
        .await
        .map_err(|error| AppError::Database(Box::new(error)))?;

        Ok(exists)
    }
}
