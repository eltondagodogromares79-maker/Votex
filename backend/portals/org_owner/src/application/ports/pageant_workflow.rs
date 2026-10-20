use async_trait::async_trait;
use core_infra::AppError;

use uuid::Uuid;

use crate::domain::pageant::Pageant;

#[cfg_attr(test, mockall::automock)]
#[async_trait]
pub trait PageantWorkflow: Send + Sync {
    async fn create_pageant(&self, pageant: Pageant) -> Result<Pageant, AppError>;

    async fn list_pageants(&self, organization_id: Uuid) -> Result<Vec<Pageant>, AppError>;

    async fn get_pageant(
        &self,
        organization_id: Uuid,
        pageant_id: Uuid,
    ) -> Result<Pageant, AppError>;

    async fn update_pageant(&self, pageant: Pageant) -> Result<Pageant, AppError>;

    async fn publish_pageant(
        &self,
        organization_id: Uuid,
        pageant_id: Uuid,
    ) -> Result<Pageant, AppError>;

    async fn archive_pageant(
        &self,
        organization_id: Uuid,
        pageant_id: Uuid,
    ) -> Result<(), AppError>;

    async fn restore_pageant(
        &self,
        organization_id: Uuid,
        pageant_id: Uuid,
    ) -> Result<(), AppError>;

    /// Count pageants that consume a plan slot, including configured archived pageants.
    /// Used by subscription limit enforcement.
    async fn count_active_pageants(&self, organization_id: Uuid) -> Result<i64, AppError>;
}
