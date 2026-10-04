use crate::domain::transaction::OrganizationTransaction;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Deserialize)]
pub struct TransactionHistoryQuery {
    pub pageant_id: Option<Uuid>,
    pub candidate_id: Option<Uuid>,
    pub from: Option<DateTime<Utc>>,
    pub to: Option<DateTime<Utc>>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

#[derive(Debug, Clone, Serialize)]
pub struct TransactionHistoryResponse {
    pub items: Vec<OrganizationTransaction>,
    pub limit: i64,
    pub offset: i64,
}
