use async_trait::async_trait;
use chrono::{DateTime, Utc};
use uuid::Uuid;

use core_infra::AppError;

#[cfg_attr(test, mockall::automock)]
#[async_trait]
pub trait EmailVerificationWorkflow: Send + Sync {
    async fn verify_email(&self, email: &str, token_hash: &str) -> Result<(), AppError>;

    async fn create_verification_token(
        &self,
        user_id: Uuid,
        token_hash: &str,
        expires_at: DateTime<Utc>,
    ) -> Result<Option<(String, String)>, AppError>;
}
