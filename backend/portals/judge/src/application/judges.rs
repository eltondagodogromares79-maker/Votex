use crate::{
    application::ports::judge_workflow::JudgeWorkflow,
    domain::{
        contestant::Contestant,
        pageant::AssignedPageant,
        round::Round,
        setup::{Category, Criterion},
    },
};
use core_infra::AppError;
use uuid::Uuid;
pub struct JudgeApplication {
    workflow: std::sync::Arc<dyn JudgeWorkflow>,
}
impl JudgeApplication {
    pub fn new(workflow: std::sync::Arc<dyn JudgeWorkflow>) -> Self {
        Self { workflow }
    }
    pub async fn pageants(&self, id: Uuid) -> Result<Vec<AssignedPageant>, AppError> {
        self.workflow.pageants(id).await
    }
    pub async fn contestants(&self, id: Uuid, pageant: Uuid) -> Result<Vec<Contestant>, AppError> {
        self.workflow.contestants(id, pageant).await
    }
    pub async fn rounds(&self, id: Uuid, pageant: Uuid) -> Result<Vec<Round>, AppError> {
        self.workflow.rounds(id, pageant).await
    }
    pub async fn categories(&self, id: Uuid, pageant: Uuid) -> Result<Vec<Category>, AppError> {
        self.workflow.categories(id, pageant).await
    }
    pub async fn criteria(&self, id: Uuid, pageant: Uuid) -> Result<Vec<Criterion>, AppError> {
        self.workflow.criteria(id, pageant).await
    }
}
