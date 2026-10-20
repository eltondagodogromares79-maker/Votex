use chrono::{NaiveDate, NaiveTime};
use uuid::Uuid;

#[derive(Debug, Clone)]
pub struct AssignedPageant {
    pub id: Uuid,
    pub organization_id: Uuid,
    pub organization_name: String,
    pub created_by: Uuid,
    pub name: String,
    pub slug: String,
    pub description: Option<String>,
    pub logo_url: Option<String>,
    pub event_date: Option<NaiveDate>,
    pub start_time: Option<NaiveTime>,
    pub end_time: Option<NaiveTime>,
    pub venue: Option<String>,
    pub status: String,
    pub is_public: bool,
}

#[derive(Debug, Clone)]
pub struct PageantResourceLimits {
    pub has_active_subscription: bool,
    pub max_judges_per_pageant: Option<i32>,
    pub max_tabulator_users: Option<i32>,
    pub max_rounds_per_pageant: Option<i32>,
    pub max_categories_per_round: Option<i32>,
    pub judges_used: i64,
    pub tabulators_used: i64,
    pub rounds_used: i64,
    pub categories_used: i64,
    pub round_categories: Vec<RoundCategoryUsage>,
}

#[derive(Debug, Clone)]
pub struct RoundCategoryUsage {
    pub round_id: Uuid,
    pub round_name: String,
    pub categories_used: i64,
}
