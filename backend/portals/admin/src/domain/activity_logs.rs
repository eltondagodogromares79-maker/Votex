use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use serde_json::Value;
use uuid::Uuid;

#[derive(Debug, Clone)]
pub struct AuditLogFilter {
    pub organization_id: Option<Uuid>,
    pub pageant_id: Option<Uuid>,
    pub actor_user_id: Option<Uuid>,
    pub action: Option<String>,
    pub resource_type: Option<String>,
    pub success: Option<bool>,
    pub from: Option<DateTime<Utc>>,
    pub to: Option<DateTime<Utc>>,
    pub limit: i64,
    pub offset: i64,
}

#[derive(Debug, Clone)]
pub struct TransactionLogFilter {
    pub organization_id: Option<Uuid>,
    pub pageant_id: Option<Uuid>,
    pub actor_user_id: Option<Uuid>,
    pub transaction_type: Option<String>,
    pub status: Option<String>,
    pub reference_type: Option<String>,
    pub reference_id: Option<Uuid>,
    pub from: Option<DateTime<Utc>>,
    pub to: Option<DateTime<Utc>>,
    pub limit: i64,
    pub offset: i64,
}

#[derive(Debug, Clone)]
pub struct AuditLog {
    pub id: Uuid,
    pub organization_id: Option<Uuid>,
    pub organization_name: Option<String>,
    pub pageant_id: Option<Uuid>,
    pub actor_user_id: Option<Uuid>,
    pub actor_email: Option<String>,
    pub actor_name: Option<String>,
    pub action: String,
    pub resource_type: String,
    pub resource_id: Option<Uuid>,
    pub before_data: Option<Value>,
    pub after_data: Option<Value>,
    pub request_id: Option<Uuid>,
    pub ip_address: Option<String>,
    pub user_agent: Option<String>,
    pub success: bool,
    pub failure_reason: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone)]
pub struct NewAuditLog {
    pub organization_id: Uuid,
    pub pageant_id: Option<Uuid>,
    pub actor_user_id: Uuid,
    pub action: String,
    pub resource_type: String,
    pub resource_id: Option<Uuid>,
    pub after_data: Value,
    pub request_id: Option<Uuid>,
    pub ip_address: Option<String>,
    pub user_agent: Option<String>,
    pub success: bool,
    pub failure_reason: Option<String>,
}

#[derive(Debug, Clone)]
pub struct TransactionLog {
    pub id: Uuid,
    pub transaction_type: String,
    pub organization_id: Option<Uuid>,
    pub organization_name: Option<String>,
    pub pageant_id: Option<Uuid>,
    pub actor_user_id: Option<Uuid>,
    pub actor_email: Option<String>,
    pub actor_name: Option<String>,
    pub reference_type: Option<String>,
    pub reference_id: Option<Uuid>,
    pub status: String,
    pub amount: Option<Decimal>,
    pub currency: Option<String>,
    pub metadata: Value,
    pub request_id: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub completed_at: Option<DateTime<Utc>>,
}
