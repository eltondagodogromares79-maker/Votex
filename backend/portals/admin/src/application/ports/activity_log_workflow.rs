use async_trait::async_trait;
use core_infra::AppError;
use uuid::Uuid;

use crate::domain::activity_logs::{
    AuditLog, AuditLogFilter, TransactionLog, TransactionLogFilter,
};

#[async_trait]
pub trait ActivityLogWorkflow: Send + Sync {
    async fn list_audit_logs(&self, filter: AuditLogFilter) -> Result<Vec<AuditLog>, AppError>;
    async fn get_audit_log(&self, id: Uuid) -> Result<AuditLog, AppError>;
    async fn list_transaction_logs(
        &self,
        filter: TransactionLogFilter,
    ) -> Result<Vec<TransactionLog>, AppError>;
    async fn get_transaction_log(&self, id: Uuid) -> Result<TransactionLog, AppError>;
}
