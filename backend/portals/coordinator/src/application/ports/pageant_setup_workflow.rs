use async_trait::async_trait;
use core_infra::AppError;
use uuid::Uuid;

use crate::domain::pageant_setup::{JudgingCriterion, PageantCategory};

#[async_trait]
pub trait PageantSetupWorkflow: Send + Sync {
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
}
