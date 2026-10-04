use crate::{
    application::ports::tabulation_workflow::TabulationWorkflow,
    domain::{
        advancement::Advancement,
        contestant::Contestant,
        pageant::AssignedPageant,
        round::Round,
        setup::{Category, Criterion},
    },
};
use core_infra::AppError;
use std::sync::Arc;
use uuid::Uuid;
pub struct TabulationApplication {
    workflow: Arc<dyn TabulationWorkflow>,
}
impl TabulationApplication {
    pub fn new(workflow: Arc<dyn TabulationWorkflow>) -> Self {
        Self { workflow }
    }
    pub async fn pageants(&self, u: Uuid) -> Result<Vec<AssignedPageant>, AppError> {
        self.workflow.pageants(u).await
    }
    pub async fn contestants(&self, u: Uuid, p: Uuid) -> Result<Vec<Contestant>, AppError> {
        self.workflow.contestants(u, p).await
    }
    pub async fn rounds(&self, u: Uuid, p: Uuid) -> Result<Vec<Round>, AppError> {
        self.workflow.rounds(u, p).await
    }
    pub async fn categories(&self, u: Uuid, p: Uuid) -> Result<Vec<Category>, AppError> {
        self.workflow.categories(u, p).await
    }
    pub async fn criteria(&self, u: Uuid, p: Uuid) -> Result<Vec<Criterion>, AppError> {
        self.workflow.criteria(u, p).await
    }
    pub async fn advancements(
        &self,
        u: Uuid,
        p: Uuid,
        r: Uuid,
    ) -> Result<Vec<Advancement>, AppError> {
        self.workflow.advancements(u, p, r).await
    }
}
