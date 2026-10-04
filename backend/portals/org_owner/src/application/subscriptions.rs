use crate::{
    application::ports::subscription_workflow::SubscriptionWorkflow,
    domain::subscription::{AvailablePlan, OrganizationSubscription},
};
use core_infra::AppError;
use core_infra::{
    application::ports::payment_provider::PaymentProvider, domain::payments::CheckoutRequest,
};
use rust_decimal::prelude::ToPrimitive;
use std::sync::Arc;
use uuid::Uuid;

pub struct SubscriptionApplication {
    workflow: Arc<dyn SubscriptionWorkflow>,
    payment_provider: Arc<dyn PaymentProvider>,
}
impl SubscriptionApplication {
    pub fn new(
        workflow: Arc<dyn SubscriptionWorkflow>,
        payment_provider: Arc<dyn PaymentProvider>,
    ) -> Self {
        Self {
            workflow,
            payment_provider,
        }
    }
    pub async fn list_plans(&self) -> Result<Vec<AvailablePlan>, AppError> {
        self.workflow.list_plans().await
    }
    pub async fn current(&self, org: Uuid) -> Result<Option<OrganizationSubscription>, AppError> {
        self.workflow.current(org).await
    }
    pub async fn current_plan(&self, org: Uuid) -> Result<Option<AvailablePlan>, AppError> {
        self.workflow.current_plan(org).await
    }
    pub async fn history(&self, org: Uuid) -> Result<Vec<OrganizationSubscription>, AppError> {
        self.workflow.history(org).await
    }
    pub async fn subscribe(
        &self,
        user_id: Uuid,
        org: Uuid,
        plan: Uuid,
        idempotency_key: &str,
    ) -> Result<OrganizationSubscription, AppError> {
        if idempotency_key.trim().is_empty() || idempotency_key.len() > 200 {
            return Err(AppError::BadRequest(
                "a valid Idempotency-Key header is required".into(),
            ));
        }

        // ── Email verification check ──────────────────────────────────────────
        let verified = self.workflow.is_email_verified(user_id).await?;
        if !verified {
            return Err(AppError::BadRequest(
                "Your email address has not been verified. \
                 Please verify your email before subscribing to a plan.".into(),
            ));
        }
        // ─────────────────────────────────────────────────────────────────────

        let mut sub = self
            .workflow
            .subscribe(org, plan, &format!("subscription:{org}:{idempotency_key}"))
            .await?;
        if sub.status == "PENDING_PAYMENT" && sub.checkout_url.is_none() {
            let payment_id = sub.payment_transaction_id.ok_or(AppError::Internal)?;
            let amount_minor = (sub.price_amount * rust_decimal::Decimal::from(100))
                .round()
                .to_i64()
                .ok_or_else(|| AppError::BadRequest("subscription amount is invalid".into()))?;
            let checkout = self
                .payment_provider
                .create_checkout(&CheckoutRequest {
                    idempotency_key: payment_id.to_string(),
                    reference_number: payment_id.to_string(),
                    item_name: format!("VoteX {} subscription", sub.plan_name),
                    description: format!("Organization subscription {}", sub.id),
                    amount_minor,
                    currency: sub.currency.clone(),
                })
                .await?;
            self.workflow
                .attach_checkout(payment_id, &checkout.id, &checkout.checkout_url)
                .await?;
            sub.checkout_url = Some(checkout.checkout_url);
        }
        Ok(sub)
    }
    pub async fn confirm_checkout(
        &self,
        session_id: &str,
        payment_id: Option<&str>,
    ) -> Result<bool, AppError> {
        self.workflow.confirm_checkout(session_id, payment_id).await
    }
    pub async fn cancel(&self, org: Uuid, subscription: Uuid) -> Result<(), AppError> {
        self.workflow.cancel(org, subscription).await
    }
}
