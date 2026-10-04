use crate::domain::transactions::{AudienceTransaction, TransactionPage};
use async_trait::async_trait;
use core_infra::AppError;
use uuid::Uuid;

#[async_trait]
pub trait TransactionHistoryWorkflow: Send + Sync {
    async fn list_for_user(
        &self,
        user_id: Uuid,
        page: TransactionPage,
    ) -> Result<Vec<AudienceTransaction>, AppError>;
}
