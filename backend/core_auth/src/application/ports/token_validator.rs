use async_trait::async_trait;
use core_infra::AppError;

use crate::domain::models::authenticated_user::AuthenticatedUser;

#[cfg_attr(test, mockall::automock)]
#[async_trait]
pub trait TokenValidator: Send + Sync {
    async fn validate_access_token(&self, token: &str) -> Result<AuthenticatedUser, AppError>;
}
