use crate::domain::{
    contestant::Contestant,
    pageant::AssignedPageant,
    round::Round,
    setup::{Category, Criterion},
};
use async_trait::async_trait;
use core_infra::AppError;
use uuid::Uuid;

#[async_trait]
pub trait JudgeWorkflow: Send + Sync {
    async fn pageants(&self, judge_id: Uuid) -> Result<Vec<AssignedPageant>, AppError>;
    async fn contestants(
        &self,
        judge_id: Uuid,
        pageant_id: Uuid,
    ) -> Result<Vec<Contestant>, AppError>;
    async fn rounds(&self, judge_id: Uuid, pageant_id: Uuid) -> Result<Vec<Round>, AppError>;
    async fn categories(&self, judge_id: Uuid, pageant_id: Uuid)
    -> Result<Vec<Category>, AppError>;
    async fn criteria(&self, judge_id: Uuid, pageant_id: Uuid) -> Result<Vec<Criterion>, AppError>;
}
