use chrono::NaiveDate;
use rust_decimal::Decimal;
use serde::Serialize;
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, FromRow)]
pub struct PublicPageant {
    pub id: Uuid,
    pub name: String,
    pub slug: String,
    pub description: Option<String>,
    pub logo_url: Option<String>,
    pub event_date: Option<NaiveDate>,
    pub venue: Option<String>,
    pub status: String,
    pub contestant_count: i64,
}

#[derive(Debug, Clone, Serialize)]
pub struct PublicPageantDetails {
    pub pageant: PublicPageant,
    pub contestants: Vec<PublicContestant>,
}

#[derive(Debug, Clone, Serialize, FromRow)]
pub struct PublicContestant {
    pub id: Uuid,
    pub contestant_number: i32,
    pub display_name: String,
    pub gender: Option<String>,
    pub photo_url: Option<String>,
    pub biography: Option<String>,
}

#[derive(Debug, Clone, Serialize, FromRow)]
pub struct PublicSubscriptionPlan {
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
