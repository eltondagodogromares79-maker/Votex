use async_trait::async_trait;
use core_infra::AppError;
use uuid::Uuid;

use crate::domain::round::{PageantRound, RoundStatus};

#[async_trait]
pub trait RoundWorkflow: Send + Sync {
    async fn list(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
    ) -> Result<Vec<PageantRound>, AppError>;
    async fn get(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
        round_id: Uuid,
    ) -> Result<PageantRound, AppError>;
    async fn create(
        &self,
        coordinator_id: Uuid,
        round: PageantRound,
    ) -> Result<PageantRound, AppError>;
    async fn update(
        &self,
        coordinator_id: Uuid,
        round: PageantRound,
        expected_status: RoundStatus,
    ) -> Result<PageantRound, AppError>;
    async fn delete(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
        round_id: Uuid,
    ) -> Result<(), AppError>;
}
