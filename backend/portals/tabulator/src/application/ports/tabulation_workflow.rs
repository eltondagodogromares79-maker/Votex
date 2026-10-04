use crate::domain::{
    advancement::Advancement,
    contestant::Contestant,
    pageant::AssignedPageant,
    round::Round,
    setup::{Category, Criterion},
};
use async_trait::async_trait;
use core_infra::AppError;
use uuid::Uuid;
#[async_trait]
pub trait TabulationWorkflow: Send + Sync {
    async fn pageants(&self, user: Uuid) -> Result<Vec<AssignedPageant>, AppError>;
    async fn contestants(&self, user: Uuid, pageant: Uuid) -> Result<Vec<Contestant>, AppError>;
    async fn rounds(&self, user: Uuid, pageant: Uuid) -> Result<Vec<Round>, AppError>;
    async fn categories(&self, user: Uuid, pageant: Uuid) -> Result<Vec<Category>, AppError>;
    async fn criteria(&self, user: Uuid, pageant: Uuid) -> Result<Vec<Criterion>, AppError>;
    async fn advancements(
        &self,
        user: Uuid,
        pageant: Uuid,
        round: Uuid,
    ) -> Result<Vec<Advancement>, AppError>;
}
