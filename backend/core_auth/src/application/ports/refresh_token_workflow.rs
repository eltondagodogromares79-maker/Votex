use async_trait::async_trait;
use core_infra::AppError;

use crate::domain::models::{auth_session::AuthSession, user::User};

#[derive(Debug, Clone)]
pub struct RefreshSessionResult {
    pub user: User,
    pub session: AuthSession,
    pub refresh_token: String,
}
#[cfg_attr(test, mockall::automock)]
#[async_trait]
pub trait RefreshTokenWorkflow: Send + Sync {
    async fn refresh_session(&self, refresh_token: &str) -> Result<RefreshSessionResult, AppError>;
}
