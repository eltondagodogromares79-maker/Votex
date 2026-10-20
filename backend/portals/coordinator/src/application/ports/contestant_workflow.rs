use async_trait::async_trait;
use core_infra::AppError;
use uuid::Uuid;

use crate::domain::contestant::{Contestant, ContestantPlacements};

#[async_trait]
pub trait ContestantWorkflow: Send + Sync {
    async fn list(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
    ) -> Result<Vec<Contestant>, AppError>;
    async fn get(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
        contestant_id: Uuid,
    ) -> Result<Contestant, AppError>;
    async fn create(
        &self,
        coordinator_id: Uuid,
        contestant: Contestant,
    ) -> Result<Contestant, AppError>;
    async fn update(
        &self,
        coordinator_id: Uuid,
        contestant: Contestant,
    ) -> Result<Contestant, AppError>;
    async fn deactivate(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
        contestant_id: Uuid,
    ) -> Result<(), AppError>;
    async fn get_placements(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
        contestant_id: Uuid,
    ) -> Result<ContestantPlacements, AppError>;
    async fn save_placements(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
        contestant_id: Uuid,
        placements: ContestantPlacements,
    ) -> Result<ContestantPlacements, AppError>;
}
