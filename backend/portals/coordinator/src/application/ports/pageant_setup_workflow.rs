use async_trait::async_trait;
use core_infra::AppError;
use uuid::Uuid;

use crate::domain::pageant_setup::{
    JudgingCriterion, LeaderboardEntry, PageantCategory, RoundJudgingConfiguration,
};

#[cfg_attr(test, mockall::automock)]
#[async_trait]
pub trait PageantSetupWorkflow: Send + Sync {
    async fn get_leaderboard(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
        round_id: Uuid,
    ) -> Result<Vec<LeaderboardEntry>, AppError>;
    async fn list_categories(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
    ) -> Result<Vec<PageantCategory>, AppError>;
    async fn get_category(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
        category_id: Uuid,
    ) -> Result<PageantCategory, AppError>;
    async fn create_category(
        &self,
        coordinator_id: Uuid,
        round_id: Option<Uuid>,
        category: PageantCategory,
    ) -> Result<PageantCategory, AppError>;
    async fn update_category(
        &self,
        coordinator_id: Uuid,
        category: PageantCategory,
    ) -> Result<PageantCategory, AppError>;
    async fn deactivate_category(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
        category_id: Uuid,
    ) -> Result<(), AppError>;
    async fn activate_category(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
        category_id: Uuid,
    ) -> Result<(), AppError>;
    async fn update_category_status(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
        category_id: Uuid,
        expected_status: String,
        status: String,
    ) -> Result<String, AppError>;
    async fn list_criteria(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
    ) -> Result<Vec<JudgingCriterion>, AppError>;
    async fn get_criterion(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
        criterion_id: Uuid,
    ) -> Result<JudgingCriterion, AppError>;
    async fn create_criterion(
        &self,
        coordinator_id: Uuid,
        criterion: JudgingCriterion,
    ) -> Result<JudgingCriterion, AppError>;
    async fn update_criterion(
        &self,
        coordinator_id: Uuid,
        criterion: JudgingCriterion,
    ) -> Result<JudgingCriterion, AppError>;
    async fn deactivate_criterion(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
        criterion_id: Uuid,
    ) -> Result<(), AppError>;
    async fn activate_criterion(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
        criterion_id: Uuid,
    ) -> Result<(), AppError>;
    async fn get_round_configuration(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
        round_id: Uuid,
    ) -> Result<RoundJudgingConfiguration, AppError>;
    async fn save_round_configuration(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
        round_id: Uuid,
        configuration: RoundJudgingConfiguration,
    ) -> Result<RoundJudgingConfiguration, AppError>;
}
