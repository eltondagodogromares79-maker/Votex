use crate::{
    application::ports::voting_workflow::VotingWorkflow,
    domain::voting::{VoteCandidate, VoteCheckout, VotePackage},
};
use core_infra::{
    AppError, application::ports::payment_provider::PaymentProvider,
    domain::payments::CheckoutRequest,
};
use std::sync::Arc;
use uuid::Uuid;
pub struct VotingApplication {
    workflow: Arc<dyn VotingWorkflow>,
    payments: Arc<dyn PaymentProvider>,
}
impl VotingApplication {
    pub fn new(workflow: Arc<dyn VotingWorkflow>, payments: Arc<dyn PaymentProvider>) -> Self {
        Self { workflow, payments }
    }
    pub async fn packages(&self, pageant: Uuid) -> Result<Vec<VotePackage>, AppError> {
        self.workflow.packages(pageant).await
    }
    pub async fn candidates(&self, pageant: Uuid) -> Result<Vec<VoteCandidate>, AppError> {
        self.workflow.candidates(pageant).await
    }
    pub async fn status(&self, user: Uuid, vote: Uuid) -> Result<VoteCheckout, AppError> {
        self.workflow.status(user, vote).await
    }
    pub async fn start_vote(
        &self,
        user: Uuid,
        pageant: Uuid,
        candidate: Uuid,
        package: Uuid,
        key: &str,
    ) -> Result<VoteCheckout, AppError> {
        validate_idempotency_key(key)?;
        let (mut vote, amount_minor, item_name) = self
            .workflow
            .start_vote(user, pageant, candidate, package, key)
            .await?;
        if vote.status == "PENDING" && vote.checkout_url.is_none() {
            let checkout = self
                .payments
                .create_checkout(&CheckoutRequest {
                    idempotency_key: vote.id.to_string(),
                    reference_number: vote.id.to_string(),
                    item_name,
                    description: format!("Audience voting purchase {}", vote.id),
                    amount_minor,
                    currency: vote.currency.clone(),
                })
                .await?;
            self.workflow
                .attach_checkout(vote.id, &checkout.id, &checkout.checkout_url)
                .await?;
            vote.checkout_url = Some(checkout.checkout_url);
        }
        Ok(vote)
    }
    pub async fn confirm_checkout(
        &self,
        session: &str,
        payment_id: Option<&str>,
    ) -> Result<bool, AppError> {
        self.workflow.confirm_checkout(session, payment_id).await
    }
}

fn validate_idempotency_key(key: &str) -> Result<(), AppError> {
    if key.trim().is_empty() || key.len() > 200 {
        return Err(AppError::BadRequest(
            "a valid Idempotency-Key header is required".into(),
        ));
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::validate_idempotency_key;

    #[test]
    fn accepts_non_blank_idempotency_key_up_to_limit() {
        assert!(validate_idempotency_key("vote-request-1").is_ok());
        assert!(validate_idempotency_key(&"k".repeat(200)).is_ok());
    }

    #[test]
    fn rejects_blank_or_oversized_idempotency_key() {
        assert!(validate_idempotency_key("  ").is_err());
        assert!(validate_idempotency_key(&"k".repeat(201)).is_err());
    }
}
