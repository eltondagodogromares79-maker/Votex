use async_trait::async_trait;

use core_infra::AppError;

use crate::domain::models::auth_session::AuthSession;
use crate::domain::models::user::User;

#[derive(Debug, Clone)]
pub struct AccessToken {
    pub token: String,
    pub expires_in: i64,
    pub role: String,
}

#[cfg_attr(test, mockall::automock)]
#[async_trait]
pub trait TokenIssuer: Send + Sync {
    async fn issue_access_token(
        &self,
        user: &User,
        session: &AuthSession,
        role: &str,
    ) -> Result<AccessToken, AppError>;
}
