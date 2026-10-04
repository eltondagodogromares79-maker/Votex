use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

use crate::domain::subscription_plan::{SubscriptionPlan, SubscriptionPlanKind};

#[derive(Debug, Deserialize, Validate)]
pub struct SubscriptionPlanRequest {
    #[validate(length(min = 1, max = 50))]
    pub code: String,
    #[validate(length(min = 1, max = 150))]
    pub name: String,
    pub kind: SubscriptionPlanKind,
    pub price_amount: Decimal,
    #[validate(length(equal = 3))]
    pub currency: String,
    pub billing_interval_months: Option<i32>,
    pub max_pageants: Option<i32>,
    pub max_tabulator_users: Option<i32>,
    pub max_judges_per_pageant: Option<i32>,
    pub max_rounds_per_pageant: Option<i32>,
    pub max_categories_per_round: Option<i32>,
    #[serde(default = "default_true")]
    pub public_voting_enabled: bool,
    #[serde(default)]
    pub customization_enabled: bool,
    #[serde(default = "default_true")]
    pub is_active: bool,
}

#[derive(Debug, Serialize)]
pub struct SubscriptionPlanResponse {
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

impl From<SubscriptionPlan> for SubscriptionPlanResponse {
    fn from(plan: SubscriptionPlan) -> Self {
        Self {
            id: plan.id,
            code: plan.code,
            name: plan.name,
            kind: plan.kind,
            price_amount: plan.price_amount,
            currency: plan.currency,
            billing_interval_months: plan.billing_interval_months,
            max_pageants: plan.max_pageants,
            max_tabulator_users: plan.max_tabulator_users,
            max_judges_per_pageant: plan.max_judges_per_pageant,
            max_rounds_per_pageant: plan.max_rounds_per_pageant,
            max_categories_per_round: plan.max_categories_per_round,
            public_voting_enabled: plan.public_voting_enabled,
            customization_enabled: plan.customization_enabled,
            is_active: plan.is_active,
        }
    }
}

fn default_true() -> bool {
    true
}
