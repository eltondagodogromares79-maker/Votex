use async_trait::async_trait;
use uuid::Uuid;

use core_infra::AppError;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AuthorizationScope {
    System,
    Organization { organization_id: Uuid },
    Pageant { pageant_id: Uuid },
}

#[cfg_attr(test, mockall::automock)]
#[async_trait]
pub trait AuthorizationWorkflow: Send + Sync {
    async fn has_permission(
        &self,
        user_id: Uuid,
        scope: AuthorizationScope,
        permission: &str,
    ) -> Result<bool, AppError>;
}
