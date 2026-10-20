use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use uuid::Uuid;

#[derive(Debug, Clone)]
pub struct LeaderboardEntry {
    pub contestant_id: Uuid,
    pub contestant_number: i32,
    pub contestant_name: String,
    pub gender: Option<String>,
    pub photo_url: Option<String>,
    pub category_id: Option<Uuid>,
    pub category_name: Option<String>,
    pub eligibility_scope: Option<String>,
    pub category_weight: Option<Decimal>,
    pub score: Option<Decimal>,
    pub submitted_judges: i64,
}

#[derive(Debug, Clone)]
pub struct PageantCategory {
    pub id: Uuid,
    pub pageant_id: Uuid,
    pub code: String,
    pub name: String,
    pub description: Option<String>,
    pub display_order: i32,
    pub eligibility_scope: String,
    pub eligibility_notes: Option<String>,
    pub is_active: bool,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone)]
pub struct JudgingCriterion {
    pub id: Uuid,
    pub pageant_id: Uuid,
    pub code: String,
    pub name: String,
    pub description: Option<String>,
    pub default_maximum_score: Decimal,
    pub default_minimum_score: Decimal,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone)]
pub struct RoundCategoryConfig {
    pub category_id: Uuid,
    pub weight_percentage: Decimal,
}

#[derive(Debug, Clone)]
pub struct RoundCriterionConfig {
    pub criterion_id: Uuid,
    pub category_id: Uuid,
    pub weight_percentage: Decimal,
    pub maximum_score: Decimal,
    pub minimum_score: Decimal,
    pub display_order: i32,
}

#[derive(Debug, Clone, Default)]
pub struct RoundJudgingConfiguration {
    pub category_ids: Vec<Uuid>,
    pub categories: Vec<RoundCategoryConfig>,
    pub criteria: Vec<RoundCriterionConfig>,
}
