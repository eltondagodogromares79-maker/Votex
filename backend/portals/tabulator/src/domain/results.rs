use rust_decimal::Decimal;
use serde::Serialize;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RoundResultEntry {
    pub contestant_id: Uuid,
    pub contestant_number: i32,
    pub contestant_name: String,
    pub gender: Option<String>,
    pub photo_url: Option<String>,
    pub contestant_status: String,
    pub category_id: Option<Uuid>,
    pub category_name: Option<String>,
    pub category_status: Option<String>,
    pub eligibility_scope: Option<String>,
    pub category_weight: Option<Decimal>,
    pub score: Option<Decimal>,
    pub submitted_judges: i64,
}
