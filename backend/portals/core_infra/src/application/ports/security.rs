use crate::domain::security::{AuthenticatedUser, AuthorizationScope};
use async_trait::async_trait;
use uuid::Uuid;

#[async_trait]
pub trait TokenAuthenticator: Send + Sync {
    async fn authenticate(&self, token: &str) -> Result<AuthenticatedUser, ()>;
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AuthorizationFailure {
    Forbidden,
    Internal,
}

#[async_trait]
pub trait PermissionAuthorizer: Send + Sync {
    async fn authorize(
        &self,
        user_id: Uuid,
        scope: AuthorizationScope,
        permission: &str,
    ) -> Result<(), AuthorizationFailure>;
}
