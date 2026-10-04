use crate::{
    application::ports::transaction_history_workflow::TransactionHistoryWorkflow,
    domain::transaction::{OrganizationTransaction, TransactionHistoryFilter},
};
use chrono::{DateTime, Utc};
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

    pub async fn list_for_organization(
        &self,
        organization_id: Uuid,
        pageant_id: Option<Uuid>,
        candidate_id: Option<Uuid>,
        from: Option<DateTime<Utc>>,
        to: Option<DateTime<Utc>>,
        limit: Option<i64>,
        offset: Option<i64>,
    ) -> Result<(Vec<OrganizationTransaction>, i64, i64), AppError> {
        let limit = limit.unwrap_or(50);
        let offset = offset.unwrap_or(0);
        if !(1..=200).contains(&limit) || offset < 0 {
            return Err(AppError::BadRequest(
                "limit must be between 1 and 200 and offset cannot be negative".into(),
            ));
        }
        if from.zip(to).is_some_and(|(start, end)| start >= end) {
            return Err(AppError::BadRequest("from must be earlier than to".into()));
        }
        let filter = TransactionHistoryFilter {
            pageant_id,
            candidate_id,
            from,
            to,
            limit,
            offset,
        };
        let items = self
            .workflow
            .list_for_organization(organization_id, filter)
            .await?;
        Ok((items, limit, offset))
    }
}
