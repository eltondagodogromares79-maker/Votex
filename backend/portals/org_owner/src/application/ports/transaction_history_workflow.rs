use crate::domain::transaction::{OrganizationTransaction, TransactionHistoryFilter};
use async_trait::async_trait;
use core_infra::AppError;
use uuid::Uuid;

#[async_trait]
pub trait TransactionHistoryWorkflow: Send + Sync {
    async fn list_for_organization(
        &self,
        organization_id: Uuid,
        filter: TransactionHistoryFilter,
    ) -> Result<Vec<OrganizationTransaction>, AppError>;
}
