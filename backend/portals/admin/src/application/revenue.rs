use std::sync::Arc;

use chrono::{DateTime, Utc};
use core_infra::AppError;
use uuid::Uuid;

use crate::{
    application::ports::revenue_workflow::RevenueWorkflow, domain::revenue::RevenueReport,
};

pub struct RevenueApplication {
    workflow: Arc<dyn RevenueWorkflow>,
}

impl RevenueApplication {
    pub fn new(workflow: Arc<dyn RevenueWorkflow>) -> Self {
        Self { workflow }
    }

    pub async fn report(
        &self,
        organization_id: Option<Uuid>,
        from: Option<DateTime<Utc>>,
        to: Option<DateTime<Utc>>,
    ) -> Result<RevenueReport, AppError> {
        if from.zip(to).is_some_and(|(from, to)| from >= to) {
            return Err(AppError::BadRequest(
                "to must be later than from".to_owned(),
            ));
        }
        self.workflow.report(organization_id, from, to).await
    }
}
