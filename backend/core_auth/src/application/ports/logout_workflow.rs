use async_trait::async_trait;
use core_infra::AppError;

#[cfg_attr(test, mockall::automock)]
#[async_trait]
pub trait LogoutWorkflow: Send + Sync {
    async fn logout(&self, refresh_token: &str) -> Result<(), AppError>;
}
