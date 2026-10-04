use std::sync::Arc;

use core_infra::AppError;
use uuid::Uuid;

use crate::{
    application::ports::activity_log_workflow::ActivityLogWorkflow,
    domain::activity_logs::{AuditLog, AuditLogFilter, TransactionLog, TransactionLogFilter},
};

pub struct ActivityLogApplication {
    workflow: Arc<dyn ActivityLogWorkflow>,
}

impl ActivityLogApplication {
    pub fn new(workflow: Arc<dyn ActivityLogWorkflow>) -> Self {
        Self { workflow }
    }

    pub async fn list_audit_logs(&self, filter: AuditLogFilter) -> Result<Vec<AuditLog>, AppError> {
        validate_period(filter.from, filter.to)?;
        self.workflow.list_audit_logs(filter).await
    }

    pub async fn get_audit_log(&self, id: Uuid) -> Result<AuditLog, AppError> {
        self.workflow.get_audit_log(id).await
    }

    pub async fn list_transaction_logs(
        &self,
        filter: TransactionLogFilter,
    ) -> Result<Vec<TransactionLog>, AppError> {
        validate_period(filter.from, filter.to)?;
        self.workflow.list_transaction_logs(filter).await
    }

    pub async fn get_transaction_log(&self, id: Uuid) -> Result<TransactionLog, AppError> {
        self.workflow.get_transaction_log(id).await
    }
}

fn validate_period(
    from: Option<chrono::DateTime<chrono::Utc>>,
    to: Option<chrono::DateTime<chrono::Utc>>,
) -> Result<(), AppError> {
    if from.zip(to).is_some_and(|(from, to)| from >= to) {
        return Err(AppError::BadRequest(
            "to must be later than from".to_owned(),
        ));
    }
    Ok(())
}
