use crate::domain::subscription::{AvailablePlan, OrganizationSubscription};
use async_trait::async_trait;
use core_infra::AppError;
use uuid::Uuid;

#[async_trait]
pub trait SubscriptionWorkflow: Send + Sync {
    async fn list_plans(&self) -> Result<Vec<AvailablePlan>, AppError>;
    async fn current(
        &self,
        organization_id: Uuid,
    ) -> Result<Option<OrganizationSubscription>, AppError>;
    /// Returns the active plan with all limit fields for the organization.
    /// Returns None if the organization has no active subscription.
    async fn current_plan(
        &self,
        organization_id: Uuid,
    ) -> Result<Option<AvailablePlan>, AppError>;
    /// Returns true if the user's email has been verified.
    async fn is_email_verified(&self, user_id: Uuid) -> Result<bool, AppError>;
    async fn history(
        &self,
        organization_id: Uuid,
    ) -> Result<Vec<OrganizationSubscription>, AppError>;
    async fn subscribe(
        &self,
        organization_id: Uuid,
        plan_id: Uuid,
        idempotency_key: &str,
    ) -> Result<OrganizationSubscription, AppError>;
    async fn attach_checkout(
        &self,
        payment_id: Uuid,
        session_id: &str,
        checkout_url: &str,
    ) -> Result<(), AppError>;
    async fn confirm_checkout(
        &self,
        session_id: &str,
        payment_id: Option<&str>,
    ) -> Result<bool, AppError>;
    async fn cancel(&self, organization_id: Uuid, subscription_id: Uuid) -> Result<(), AppError>;
}
