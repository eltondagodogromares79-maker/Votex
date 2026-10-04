use async_trait::async_trait;
use core_infra::AppError;
use uuid::Uuid;

use crate::domain::subscription_plan::SubscriptionPlan;

#[cfg_attr(test, mockall::automock)]
#[async_trait]
pub trait SubscriptionPlanWorkflow: Send + Sync {
    async fn list(&self) -> Result<Vec<SubscriptionPlan>, AppError>;
    async fn get(&self, id: Uuid) -> Result<SubscriptionPlan, AppError>;
    async fn create(&self, plan: SubscriptionPlan) -> Result<SubscriptionPlan, AppError>;
    async fn update(&self, plan: SubscriptionPlan) -> Result<SubscriptionPlan, AppError>;
    async fn deactivate(&self, id: Uuid) -> Result<(), AppError>;
}
