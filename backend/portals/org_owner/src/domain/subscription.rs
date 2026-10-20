use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use serde::Serialize;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize)]
pub struct AvailablePlan {
    pub id: Uuid,
    pub code: String,
    pub name: String,
    pub kind: String,
    pub price_amount: Decimal,
    pub currency: String,
    pub billing_interval_months: Option<i32>,
    pub max_pageants: Option<i32>,
    pub max_tabulator_users: Option<i32>,
    pub max_judges_per_pageant: Option<i32>,
    pub max_rounds_per_pageant: Option<i32>,
    pub max_categories_per_round: Option<i32>,
    pub public_voting_enabled: bool,
    pub customization_enabled: bool,
}

#[derive(Debug, Clone, Serialize)]
pub struct PageantResourceUsage {
    pub pageant_id: Uuid,
    pub pageant_name: String,
    pub judges_used: i64,
    pub rounds_used: i64,
    pub categories_used: i64,
}

#[derive(Debug, Clone, Serialize)]
pub struct OrganizationPlanUsage {
    pub plan_name: Option<String>,
    pub subscription_status: Option<String>,
    pub has_created_pageant: bool,
    pub pageants_used: i64,
    pub max_pageants: Option<i32>,
    pub tabulator_users_used: i64,
    pub max_tabulator_users: Option<i32>,
    pub max_judges_per_pageant: Option<i32>,
    pub max_rounds_per_pageant: Option<i32>,
    pub max_categories_per_round: Option<i32>,
    pub pageants: Vec<PageantResourceUsage>,
}

#[derive(Debug, Clone, Serialize)]
pub struct OrganizationSubscription {
    pub id: Uuid,
    pub organization_id: Uuid,
    pub plan_id: Uuid,
    pub plan_code: String,
    pub plan_name: String,
    pub status: String,
    pub price_amount: Decimal,
    pub currency: String,
    pub starts_at: DateTime<Utc>,
    pub ends_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub payment_transaction_id: Option<Uuid>,
    pub checkout_url: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct SubscriptionPaymentProof {
    pub id: Uuid,
    pub subscription_id: Uuid,
    pub organization_id: Uuid,
    pub organization_name: String,
    pub plan_name: String,
    pub amount: Decimal,
    pub amount_paid: Decimal,
    pub currency: String,
    pub payment_method: String,
    pub reference_number: String,
    pub proof_url: Option<String>,
    pub status: String,
    pub submitted_at: DateTime<Utc>,
    pub reviewed_at: Option<DateTime<Utc>>,
    pub review_note: Option<String>,
    pub revoked_at: Option<DateTime<Utc>>,
    pub revocation_note: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct PendingSubscriptionPayment {
    pub subscription: OrganizationSubscription,
    pub latest_proof: Option<SubscriptionPaymentProof>,
}

#[derive(Debug, Clone, Serialize)]
pub struct AdminSubscriptionPayment {
    pub id: Uuid,
    pub amount: Decimal,
    pub currency: String,
    pub status: String,
    pub payment_method: Option<String>,
    pub reference_number: Option<String>,
    pub created_at: DateTime<Utc>,
    pub paid_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize)]
pub struct AdminSubscriptionAction {
    pub id: Uuid,
    pub action: String,
    pub reason: Option<String>,
    pub admin_name: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize)]
pub struct AdminSubscriptionDetails {
    pub organization_id: Uuid,
    pub organization_name: String,
    pub organization_slug: String,
    pub owner_user_id: Uuid,
    pub owner_first_name: String,
    pub owner_last_name: String,
    pub owner_email: String,
    pub subscription: Option<OrganizationSubscription>,
    pub payment: Option<AdminSubscriptionPayment>,
    pub proof: Option<SubscriptionPaymentProof>,
    pub actions: Vec<AdminSubscriptionAction>,
}
