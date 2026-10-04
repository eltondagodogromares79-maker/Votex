use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use uuid::Uuid;

#[derive(Debug, Clone)]
pub struct PageantCategory {
    pub id: Uuid,
    pub pageant_id: Uuid,
    pub code: String,
    pub name: String,
    pub description: Option<String>,
    pub display_order: i32,
    pub is_active: bool,
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
