use crate::domain::transactions::AudienceTransaction;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Deserialize)]
pub struct TransactionHistoryQuery {
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

#[derive(Debug, Clone, Serialize)]
pub struct TransactionHistoryResponse {
    pub items: Vec<AudienceTransaction>,
    pub limit: i64,
    pub offset: i64,
}
