use async_trait::async_trait;
use chrono::{DateTime, Utc};
use core_infra::AppError;
use uuid::Uuid;

use crate::domain::revenue::RevenueReport;

#[async_trait]
pub trait RevenueWorkflow: Send + Sync {
    async fn report(
        &self,
        organization_id: Option<Uuid>,
        from: Option<DateTime<Utc>>,
        to: Option<DateTime<Utc>>,
    ) -> Result<RevenueReport, AppError>;
}
