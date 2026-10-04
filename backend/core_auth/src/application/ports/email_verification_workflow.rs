use async_trait::async_trait;

use core_infra::AppError;

#[cfg_attr(test, mockall::automock)]
#[async_trait]
pub trait EmailVerificationWorkflow: Send + Sync {
    async fn verify_email(&self, email: &str, token_hash: &str) -> Result<(), AppError>;
}
