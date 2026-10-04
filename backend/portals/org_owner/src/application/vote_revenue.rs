use crate::{
    application::ports::vote_revenue_workflow::VoteRevenueWorkflow,
    domain::vote_revenue::VoteRevenueReport,
};
use chrono::{DateTime, Utc};
use core_infra::AppError;
use std::sync::Arc;
use uuid::Uuid;

pub struct VoteRevenueApplication {
    workflow: Arc<dyn VoteRevenueWorkflow>,
}
impl VoteRevenueApplication {
    pub fn new(workflow: Arc<dyn VoteRevenueWorkflow>) -> Self {
        Self { workflow }
    }
    pub async fn report(
        &self,
        organization_id: Uuid,
        pageant_id: Option<Uuid>,
        candidate_id: Option<Uuid>,
        from: Option<DateTime<Utc>>,
        to: Option<DateTime<Utc>>,
    ) -> Result<VoteRevenueReport, AppError> {
        if from.zip(to).is_some_and(|(from, to)| from >= to) {
            return Err(AppError::BadRequest(
                "from must be earlier than to".to_owned(),
            ));
        }
        self.workflow
            .report(organization_id, pageant_id, candidate_id, from, to)
            .await
    }
}
