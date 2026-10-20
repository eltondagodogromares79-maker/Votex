use crate::domain::subscription::{
    AdminSubscriptionDetails, AvailablePlan, OrganizationPlanUsage, OrganizationSubscription,
    PendingSubscriptionPayment, SubscriptionPaymentProof,
};
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
    async fn current_plan(&self, organization_id: Uuid) -> Result<Option<AvailablePlan>, AppError>;
    async fn usage(&self, organization_id: Uuid) -> Result<OrganizationPlanUsage, AppError>;
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
        payment_method: Option<&str>,
        reference_number: Option<&str>,
        amount_paid: Option<rust_decimal::Decimal>,
        proof_url: Option<&str>,
        automated: bool,
    ) -> Result<OrganizationSubscription, AppError>;
    async fn pending_payment(
        &self,
        organization_id: Uuid,
    ) -> Result<Option<PendingSubscriptionPayment>, AppError>;
    async fn submit_payment_proof(
        &self,
        organization_id: Uuid,
        subscription_id: Uuid,
        payment_method: &str,
        reference_number: &str,
        amount_paid: rust_decimal::Decimal,
        proof_url: Option<&str>,
    ) -> Result<SubscriptionPaymentProof, AppError>;
    async fn list_pending_payment_proofs(&self) -> Result<Vec<SubscriptionPaymentProof>, AppError>;
    async fn list_payment_proof_history(&self) -> Result<Vec<SubscriptionPaymentProof>, AppError>;
    async fn list_organization_payment_proof_history(
        &self,
        organization_id: Uuid,
    ) -> Result<Vec<SubscriptionPaymentProof>, AppError>;
    async fn admin_subscription_details(
        &self,
        organization_id: Uuid,
    ) -> Result<AdminSubscriptionDetails, AppError>;
    async fn admin_cancel_subscription(
        &self,
        subscription_id: Uuid,
        admin_user_id: Uuid,
        reason: &str,
    ) -> Result<(), AppError>;
    async fn review_payment_proof(
        &self,
        proof_id: Uuid,
        admin_user_id: Uuid,
        approved: bool,
        note: Option<&str>,
    ) -> Result<SubscriptionPaymentProof, AppError>;
    async fn revoke_payment_approval(
        &self,
        proof_id: Uuid,
        admin_user_id: Uuid,
        reason: &str,
    ) -> Result<SubscriptionPaymentProof, AppError>;
    async fn attach_checkout(
        &self,
        payment_id: Uuid,
        session_id: &str,
        checkout_url: &str,
    ) -> Result<(), AppError>;
    async fn is_paymongo_pending_checkout(
        &self,
        organization_id: Uuid,
        subscription_id: Uuid,
    ) -> Result<bool, AppError>;
    async fn confirm_checkout(
        &self,
        session_id: &str,
        payment_id: Option<&str>,
    ) -> Result<bool, AppError>;
    async fn cancel(&self, organization_id: Uuid, subscription_id: Uuid) -> Result<(), AppError>;
}
