use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Copy, Deserialize, Serialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum SubscriptionPlanKind {
    OneTime,
    Premium,
    Custom,
}

impl SubscriptionPlanKind {
    pub fn as_db_str(self) -> &'static str {
        match self {
            Self::OneTime => "ONE_TIME",
            Self::Premium => "PREMIUM",
            Self::Custom => "CUSTOM",
        }
    }
}

#[derive(Debug, Clone)]
pub struct SubscriptionPlan {
    pub id: Uuid,
    pub code: String,
    pub name: String,
    pub kind: SubscriptionPlanKind,
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
    pub is_active: bool,
}
