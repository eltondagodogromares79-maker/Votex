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
