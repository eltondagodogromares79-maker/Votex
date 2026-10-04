use serde::Serialize;
use uuid::Uuid;
#[derive(Debug, Clone, Serialize)]
pub struct Category {
    pub id: Uuid,
    pub pageant_id: Uuid,
    pub code: String,
    pub name: String,
    pub description: Option<String>,
    pub display_order: i32,
    pub is_active: bool,
}
#[derive(Debug, Clone, Serialize)]
pub struct Criterion {
    pub id: Uuid,
    pub pageant_id: Uuid,
    pub code: String,
    pub name: String,
    pub description: Option<String>,
    pub default_maximum_score: rust_decimal::Decimal,
    pub default_minimum_score: rust_decimal::Decimal,
    pub is_active: bool,
}
