use std::net::IpAddr;

use async_trait::async_trait;
use uuid::Uuid;

use core_infra::AppError;

use crate::domain::models::auth_session::AuthSession;

#[derive(Debug, Clone)]
pub struct CreateSessionResult {
    pub session: AuthSession,
    pub refresh_token: String,
}

#[cfg_attr(test, mockall::automock)]
#[async_trait]
pub trait SessionWorkflow: Send + Sync {
    async fn create_session(
        &self,
        user_id: Uuid,
        user_agent: Option<String>,
        ip_address: Option<IpAddr>,
    ) -> Result<CreateSessionResult, AppError>;

    async fn revoke_session(&self, session_id: Uuid) -> Result<(), AppError>;
}
