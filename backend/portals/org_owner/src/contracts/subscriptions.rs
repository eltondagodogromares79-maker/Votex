use rust_decimal::Decimal;
use serde::Deserialize;
use uuid::Uuid;
use validator::Validate;

#[derive(Debug, Deserialize, Validate)]
pub struct SubscribeRequest {
    pub plan_id: Uuid,
    #[validate(length(min = 1))]
    pub payment_method: Option<String>,
    #[validate(length(min = 1, max = 120))]
    pub reference_number: Option<String>,
    pub amount_paid: Option<Decimal>,
    #[validate(url)]
    pub proof_url: Option<String>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct SubmitPaymentProofRequest {
    #[validate(length(min = 1))]
    pub payment_method: String,
    #[validate(length(min = 1, max = 120))]
    pub reference_number: String,
    pub amount_paid: Decimal,
    #[validate(url)]
    pub proof_url: Option<String>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct ReviewPaymentProofRequest {
    pub approved: bool,
    #[validate(length(max = 1000))]
    pub note: Option<String>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct RevokePaymentApprovalRequest {
    #[validate(length(min = 1, max = 1000))]
    pub reason: String,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CancelAdminSubscriptionRequest {
    #[validate(length(min = 1, max = 1000))]
    pub reason: String,
}
