use crate::domain::vote_revenue::VoteRevenueReport;
use async_trait::async_trait;
use chrono::{DateTime, Utc};
use core_infra::AppError;
use uuid::Uuid;

#[async_trait]
pub trait VoteRevenueWorkflow: Send + Sync {
    async fn report(
        &self,
        organization_id: Uuid,
        pageant_id: Option<Uuid>,
        candidate_id: Option<Uuid>,
        from: Option<DateTime<Utc>>,
        to: Option<DateTime<Utc>>,
    ) -> Result<VoteRevenueReport, AppError>;
}
