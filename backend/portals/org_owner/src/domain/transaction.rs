use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use serde::Serialize;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize)]
pub struct OrganizationTransaction {
    pub id: Uuid,
    pub source: String,
    pub transaction_type: String,
    pub reference_id: Option<Uuid>,
    pub description: String,
    pub pageant_id: Option<Uuid>,
    pub pageant_name: Option<String>,
    pub candidate_id: Option<Uuid>,
    pub candidate_name: Option<String>,
    pub amount: Option<Decimal>,
    pub currency: Option<String>,
    pub status: String,
    pub provider: Option<String>,
    pub provider_transaction_id: Option<String>,
    pub created_at: DateTime<Utc>,
    pub completed_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Copy)]
pub struct TransactionHistoryFilter {
    pub pageant_id: Option<Uuid>,
    pub candidate_id: Option<Uuid>,
    pub from: Option<DateTime<Utc>>,
    pub to: Option<DateTime<Utc>>,
    pub limit: i64,
    pub offset: i64,
}
