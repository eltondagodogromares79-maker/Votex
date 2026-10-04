use async_trait::async_trait;
use core_infra::AppError;
use uuid::Uuid;

use crate::domain::pageant::AssignedPageant;

#[async_trait]
pub trait PageantWorkflow: Send + Sync {
    async fn list_assigned(&self, coordinator_id: Uuid) -> Result<Vec<AssignedPageant>, AppError>;
    async fn get_assigned(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
    ) -> Result<AssignedPageant, AppError>;
    async fn update_assigned(
        &self,
        coordinator_id: Uuid,
        pageant: AssignedPageant,
    ) -> Result<AssignedPageant, AppError>;
}
