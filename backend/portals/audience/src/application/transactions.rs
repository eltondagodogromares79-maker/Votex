use crate::{
    application::ports::transaction_history_workflow::TransactionHistoryWorkflow,
    domain::transactions::{AudienceTransaction, TransactionPage},
};
use core_infra::AppError;
use std::sync::Arc;
use uuid::Uuid;

pub struct TransactionHistoryApplication {
    workflow: Arc<dyn TransactionHistoryWorkflow>,
}

impl TransactionHistoryApplication {
    pub fn new(workflow: Arc<dyn TransactionHistoryWorkflow>) -> Self {
        Self { workflow }
    }

    pub async fn list_for_user(
        &self,
        user_id: Uuid,
        limit: Option<i64>,
        offset: Option<i64>,
    ) -> Result<(Vec<AudienceTransaction>, i64, i64), AppError> {
        let limit = limit.unwrap_or(50);
        let offset = offset.unwrap_or(0);
        if !(1..=200).contains(&limit) || offset < 0 {
            return Err(AppError::BadRequest(
                "limit must be between 1 and 200 and offset cannot be negative".into(),
            ));
        }
        let items = self
            .workflow
            .list_for_user(user_id, TransactionPage { limit, offset })
            .await?;
        Ok((items, limit, offset))
    }
}
