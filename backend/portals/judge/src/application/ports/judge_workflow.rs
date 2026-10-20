use crate::domain::{
    contestant::Contestant,
    pageant::AssignedPageant,
    round::Round,
    setup::{
        Category, CategoryScoringWorkspace, CategorySubmissionResult, Criterion,
        CriterionScoreInput, ScoreSubmissionResult,
    },
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
    async fn category_scoring(
        &self,
        judge_id: Uuid,
        pageant_id: Uuid,
        round_id: Uuid,
        category_id: Uuid,
    ) -> Result<CategoryScoringWorkspace, AppError>;
    async fn save_category_score_draft(
        &self,
        judge_id: Uuid,
        pageant_id: Uuid,
        round_id: Uuid,
        category_id: Uuid,
        contestant_id: Uuid,
        scores: Vec<CriterionScoreInput>,
    ) -> Result<ScoreSubmissionResult, AppError>;
    async fn submit_category_scores(
        &self,
        judge_id: Uuid,
        pageant_id: Uuid,
        round_id: Uuid,
        category_id: Uuid,
    ) -> Result<CategorySubmissionResult, AppError>;
}
