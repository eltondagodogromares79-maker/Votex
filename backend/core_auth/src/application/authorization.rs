use std::sync::Arc;

use async_trait::async_trait;
use core_infra::{
    application::ports::security::{AuthorizationFailure, PermissionAuthorizer},
    domain::security::AuthorizationScope as SharedAuthorizationScope,
};
use uuid::Uuid;

use super::ports::authorization_workflow::{AuthorizationScope, AuthorizationWorkflow};

pub struct AuthorizationApplication {
    workflow: Arc<dyn AuthorizationWorkflow>,
}

impl AuthorizationApplication {
    pub fn new(workflow: Arc<dyn AuthorizationWorkflow>) -> Self {
        Self { workflow }
    }

    pub async fn authorize(
        &self,
        user_id: Uuid,
        scope: AuthorizationScope,
        permission: &str,
    ) -> Result<(), core_infra::AppError> {
        let allowed = self
            .workflow
            .has_permission(user_id, scope, permission)
            .await?;

        if !allowed {
            return Err(core_infra::AppError::Forbidden);
        }

        Ok(())
    }
}

#[async_trait]
impl PermissionAuthorizer for AuthorizationApplication {
    async fn authorize(
        &self,
        user_id: Uuid,
        scope: SharedAuthorizationScope,
        permission: &str,
    ) -> Result<(), AuthorizationFailure> {
        let scope = match scope {
            SharedAuthorizationScope::System => AuthorizationScope::System,
            SharedAuthorizationScope::Organization { organization_id } => {
                AuthorizationScope::Organization { organization_id }
            }
            SharedAuthorizationScope::Pageant { pageant_id } => {
                AuthorizationScope::Pageant { pageant_id }
            }
        };
        AuthorizationApplication::authorize(self, user_id, scope, permission)
            .await
            .map_err(|error| match error {
                core_infra::AppError::Forbidden => AuthorizationFailure::Forbidden,
                _ => AuthorizationFailure::Internal,
            })
    }
}
