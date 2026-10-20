use crate::{
    application::ports::judge_workflow::JudgeWorkflow,
    domain::{
        contestant::Contestant,
        pageant::AssignedPageant,
        round::Round,
        setup::{
            Category, CategoryScoringWorkspace, CategorySubmissionResult, Criterion,
            CriterionScoreInput, ScoreSubmissionResult,
        },
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
    pub async fn category_scoring(
        &self,
        id: Uuid,
        pageant: Uuid,
        round: Uuid,
        category: Uuid,
    ) -> Result<CategoryScoringWorkspace, AppError> {
        self.workflow
            .category_scoring(id, pageant, round, category)
            .await
    }
    pub async fn save_category_score_draft(
        &self,
        id: Uuid,
        pageant: Uuid,
        round: Uuid,
        category: Uuid,
        contestant: Uuid,
        scores: Vec<CriterionScoreInput>,
    ) -> Result<ScoreSubmissionResult, AppError> {
        self.workflow
            .save_category_score_draft(id, pageant, round, category, contestant, scores)
            .await
    }
    pub async fn submit_category_scores(
        &self,
        id: Uuid,
        pageant: Uuid,
        round: Uuid,
        category: Uuid,
    ) -> Result<CategorySubmissionResult, AppError> {
        self.workflow
            .submit_category_scores(id, pageant, round, category)
            .await
    }
}
