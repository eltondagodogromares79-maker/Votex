use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use serde::Serialize;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize)]
pub struct AudienceTransaction {
    pub id: Uuid,
    pub pageant_id: Uuid,
    pub pageant_name: String,
    pub contestant_id: Uuid,
    pub contestant_name: String,
    pub package_id: Option<Uuid>,
    pub package_name: Option<String>,
    pub vote_quantity: i32,
    pub amount: Decimal,
    pub currency: String,
    pub status: String,
    pub provider_payment_id: Option<String>,
    pub created_at: DateTime<Utc>,
    pub paid_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Copy)]
pub struct TransactionPage {
    pub limit: i64,
    pub offset: i64,
}
