use crate::domain::contact_messages::{ContactMessagePage, SubmittedContactMessage};
use async_trait::async_trait;
use core_infra::AppError;
use uuid::Uuid;

#[async_trait]
pub trait ContactMessageWorkflow: Send + Sync {
    async fn submit(
        &self,
        user_id: Uuid,
        subject: &str,
        message: &str,
    ) -> Result<Option<SubmittedContactMessage>, AppError>;
    async fn list(&self, limit: i64, offset: i64) -> Result<ContactMessagePage, AppError>;
}
