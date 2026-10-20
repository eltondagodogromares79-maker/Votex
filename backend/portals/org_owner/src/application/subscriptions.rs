use crate::{
    application::ports::subscription_workflow::SubscriptionWorkflow,
    contracts::subscriptions::{SubmitPaymentProofRequest, SubscribeRequest},
    domain::subscription::{
        AdminSubscriptionDetails, AvailablePlan, OrganizationPlanUsage, OrganizationSubscription,
        PendingSubscriptionPayment, SubscriptionPaymentProof,
    },
};
use core_infra::AppError;
use core_infra::{
    application::ports::payment_provider::PaymentProvider, config::SubscriptionPaymentMode,
    domain::payments::CheckoutRequest,
};
use rust_decimal::prelude::ToPrimitive;
use std::sync::Arc;
use uuid::Uuid;

pub struct SubscriptionApplication {
    workflow: Arc<dyn SubscriptionWorkflow>,
    payment_provider: Arc<dyn PaymentProvider>,
    payment_mode: SubscriptionPaymentMode,
}
impl SubscriptionApplication {
    pub fn new(
        workflow: Arc<dyn SubscriptionWorkflow>,
        payment_provider: Arc<dyn PaymentProvider>,
        payment_mode: SubscriptionPaymentMode,
    ) -> Self {
        Self {
            workflow,
            payment_provider,
            payment_mode,
        }
    }
    pub fn payment_mode(&self) -> &'static str {
        self.payment_mode.as_str()
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
    pub async fn usage(&self, org: Uuid) -> Result<OrganizationPlanUsage, AppError> {
        self.workflow.usage(org).await
    }
    pub async fn history(&self, org: Uuid) -> Result<Vec<OrganizationSubscription>, AppError> {
        self.workflow.history(org).await
    }
    pub async fn subscribe(
        &self,
        user_id: Uuid,
        org: Uuid,
        request: SubscribeRequest,
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
            return Err(AppError::EmailNotVerified);
        }
        // ─────────────────────────────────────────────────────────────────────

        let payment_method = request
            .payment_method
            .map(|value| value.trim().to_ascii_uppercase());
        if payment_method
            .as_deref()
            .is_some_and(|method| !matches!(method, "GCASH" | "MAYA" | "MARIBANK"))
        {
            return Err(AppError::BadRequest(
                "Choose GCash, Maya, or MariBank.".into(),
            ));
        }
        let reference_number = request
            .reference_number
            .map(|value| value.trim().to_owned());
        let proof_url = request.proof_url.map(|value| value.trim().to_owned());
        if let Some(proof_url) = proof_url.as_deref() {
            validate_cloudinary_url(proof_url)?;
        }
        let automated = self.payment_mode == SubscriptionPaymentMode::Automated;
        if automated
            && (payment_method.is_some()
                || reference_number.is_some()
                || request.amount_paid.is_some()
                || proof_url.is_some())
        {
            return Err(AppError::BadRequest(
                "Manual payment details are not accepted while automated checkout is enabled."
                    .into(),
            ));
        }

        let mut subscription = self
            .workflow
            .subscribe(
                org,
                request.plan_id,
                &format!("subscription:{org}:{idempotency_key}"),
                payment_method.as_deref(),
                reference_number.as_deref(),
                request.amount_paid,
                proof_url.as_deref(),
                automated,
            )
            .await?;
        if automated && subscription.status == "PENDING_PAYMENT" {
            self.create_paymongo_checkout(&mut subscription).await?;
        }
        Ok(subscription)
    }
    pub async fn pending_payment(
        &self,
        org: Uuid,
    ) -> Result<Option<PendingSubscriptionPayment>, AppError> {
        self.workflow.pending_payment(org).await
    }
    pub async fn admin_subscription_details(
        &self,
        organization_id: Uuid,
    ) -> Result<AdminSubscriptionDetails, AppError> {
        self.workflow
            .admin_subscription_details(organization_id)
            .await
    }
    pub async fn admin_cancel_subscription(
        &self,
        subscription_id: Uuid,
        admin_user_id: Uuid,
        reason: String,
    ) -> Result<(), AppError> {
        let reason = reason.trim();
        if reason.is_empty() || reason.len() > 1000 {
            return Err(AppError::BadRequest(
                "A cancellation reason is required (maximum 1000 characters).".into(),
            ));
        }
        self.workflow
            .admin_cancel_subscription(subscription_id, admin_user_id, reason)
            .await
    }
    pub async fn submit_payment_proof(
        &self,
        org: Uuid,
        subscription_id: Uuid,
        request: SubmitPaymentProofRequest,
    ) -> Result<SubscriptionPaymentProof, AppError> {
        let method = request.payment_method.trim().to_ascii_uppercase();
        if !matches!(method.as_str(), "GCASH" | "MAYA" | "MARIBANK") {
            return Err(AppError::BadRequest(
                "Choose GCash, Maya, or MariBank.".into(),
            ));
        }
        let reference = request.reference_number.trim();
        let proof_url = request
            .proof_url
            .as_deref()
            .map(str::trim)
            .filter(|url| !url.is_empty());
        if let Some(proof_url) = proof_url {
            validate_cloudinary_url(proof_url)?;
        }
        self.workflow
            .submit_payment_proof(
                org,
                subscription_id,
                &method,
                reference,
                request.amount_paid,
                proof_url,
            )
            .await
    }
    pub async fn list_pending_payment_proofs(
        &self,
    ) -> Result<Vec<SubscriptionPaymentProof>, AppError> {
        self.workflow.list_pending_payment_proofs().await
    }
    pub async fn list_payment_proof_history(
        &self,
    ) -> Result<Vec<SubscriptionPaymentProof>, AppError> {
        self.workflow.list_payment_proof_history().await
    }
    pub async fn list_organization_payment_proof_history(
        &self,
        organization_id: Uuid,
    ) -> Result<Vec<SubscriptionPaymentProof>, AppError> {
        self.workflow
            .list_organization_payment_proof_history(organization_id)
            .await
    }
    pub async fn review_payment_proof(
        &self,
        proof_id: Uuid,
        admin_user_id: Uuid,
        approved: bool,
        note: Option<String>,
    ) -> Result<SubscriptionPaymentProof, AppError> {
        self.workflow
            .review_payment_proof(proof_id, admin_user_id, approved, note.as_deref())
            .await
    }
    pub async fn revoke_payment_approval(
        &self,
        proof_id: Uuid,
        admin_user_id: Uuid,
        reason: String,
    ) -> Result<SubscriptionPaymentProof, AppError> {
        let reason = reason.trim();
        if reason.is_empty() || reason.len() > 1000 {
            return Err(AppError::BadRequest(
                "Provide a revocation reason of at most 1000 characters.".into(),
            ));
        }
        self.workflow
            .revoke_payment_approval(proof_id, admin_user_id, reason)
            .await
    }

    /// PayMongo checkout support retained for the v2 automated payment flow.
    pub async fn create_paymongo_checkout(
        &self,
        sub: &mut OrganizationSubscription,
    ) -> Result<(), AppError> {
        if sub.status != "PENDING_PAYMENT" || sub.checkout_url.is_some() {
            return Ok(());
        }
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
        Ok(())
    }
    pub async fn create_pending_checkout(
        &self,
        org: Uuid,
        subscription_id: Uuid,
    ) -> Result<OrganizationSubscription, AppError> {
        if !self
            .workflow
            .is_paymongo_pending_checkout(org, subscription_id)
            .await?
        {
            return Err(AppError::Conflict(
                "This pending subscription was not created for PayMongo checkout. Contact support before changing its payment method.".into(),
            ));
        }
        let mut pending = self
            .workflow
            .pending_payment(org)
            .await?
            .filter(|payment| payment.subscription.id == subscription_id)
            .ok_or_else(|| AppError::NotFound("pending subscription payment".into()))?
            .subscription;
        self.create_paymongo_checkout(&mut pending).await?;
        Ok(pending)
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

fn validate_cloudinary_url(value: &str) -> Result<(), AppError> {
    let url = url::Url::parse(value)
        .map_err(|_| AppError::BadRequest("A valid Cloudinary proof URL is required.".into()))?;
    if url.scheme() != "https"
        || !url
            .host_str()
            .is_some_and(|host| host == "res.cloudinary.com")
    {
        return Err(AppError::BadRequest(
            "Payment proof must be uploaded to Cloudinary.".into(),
        ));
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::validate_cloudinary_url;

    #[test]
    fn accepts_https_cloudinary_resource_url() {
        assert!(
            validate_cloudinary_url("https://res.cloudinary.com/demo/image/upload/proof.jpg")
                .is_ok()
        );
    }

    #[test]
    fn rejects_non_cloudinary_hosts_and_non_https_urls() {
        assert!(validate_cloudinary_url("http://res.cloudinary.com/demo/proof.jpg").is_err());
        assert!(validate_cloudinary_url("https://example.com/proof.jpg").is_err());
    }
}
