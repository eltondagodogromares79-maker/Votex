use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use uuid::Uuid;

use crate::domain::activity_logs::{
    AuditLog, AuditLogFilter, TransactionLog, TransactionLogFilter,
};

#[derive(Debug, Deserialize)]
pub struct AuditLogQuery {
    pub organization_id: Option<Uuid>,
    pub pageant_id: Option<Uuid>,
    pub actor_user_id: Option<Uuid>,
    pub action: Option<String>,
    pub resource_type: Option<String>,
    pub success: Option<bool>,
    pub from: Option<DateTime<Utc>>,
    pub to: Option<DateTime<Utc>>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

#[derive(Debug, Deserialize)]
pub struct TransactionLogQuery {
    pub organization_id: Option<Uuid>,
    pub pageant_id: Option<Uuid>,
    pub actor_user_id: Option<Uuid>,
    pub transaction_type: Option<String>,
    pub status: Option<String>,
    pub reference_type: Option<String>,
    pub reference_id: Option<Uuid>,
    pub from: Option<DateTime<Utc>>,
    pub to: Option<DateTime<Utc>>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

impl AuditLogQuery {
    pub fn bounded_values(&self) -> (i64, i64) {
        (
            self.limit.unwrap_or(50).clamp(1, 100),
            self.offset.unwrap_or(0).max(0),
        )
    }

    pub fn into_filter(self) -> AuditLogFilter {
        let (limit, offset) = self.bounded_values();
        AuditLogFilter {
            organization_id: self.organization_id,
            pageant_id: self.pageant_id,
            actor_user_id: self.actor_user_id,
            action: self.action,
            resource_type: self.resource_type,
            success: self.success,
            from: self.from,
            to: self.to,
            limit,
            offset,
        }
    }
}

impl TransactionLogQuery {
    pub fn bounded_values(&self) -> (i64, i64) {
        (
            self.limit.unwrap_or(50).clamp(1, 100),
            self.offset.unwrap_or(0).max(0),
        )
    }

    pub fn into_filter(self) -> TransactionLogFilter {
        let (limit, offset) = self.bounded_values();
        TransactionLogFilter {
            organization_id: self.organization_id,
            pageant_id: self.pageant_id,
            actor_user_id: self.actor_user_id,
            transaction_type: self.transaction_type,
            status: self.status,
            reference_type: self.reference_type,
            reference_id: self.reference_id,
            from: self.from,
            to: self.to,
            limit,
            offset,
        }
    }
}

#[derive(Debug, Serialize)]
pub struct AuditLogResponse {
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

impl From<AuditLog> for AuditLogResponse {
    fn from(log: AuditLog) -> Self {
        Self {
            id: log.id,
            organization_id: log.organization_id,
            organization_name: log.organization_name,
            pageant_id: log.pageant_id,
            actor_user_id: log.actor_user_id,
            actor_email: log.actor_email,
            actor_name: log.actor_name,
            action: log.action,
            resource_type: log.resource_type,
            resource_id: log.resource_id,
            before_data: log.before_data,
            after_data: log.after_data,
            request_id: log.request_id,
            ip_address: log.ip_address,
            user_agent: log.user_agent,
            success: log.success,
            failure_reason: log.failure_reason,
            created_at: log.created_at,
        }
    }
}

#[derive(Debug, Serialize)]
pub struct TransactionLogResponse {
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

impl From<TransactionLog> for TransactionLogResponse {
    fn from(log: TransactionLog) -> Self {
        Self {
            id: log.id,
            transaction_type: log.transaction_type,
            organization_id: log.organization_id,
            organization_name: log.organization_name,
            pageant_id: log.pageant_id,
            actor_user_id: log.actor_user_id,
            actor_email: log.actor_email,
            actor_name: log.actor_name,
            reference_type: log.reference_type,
            reference_id: log.reference_id,
            status: log.status,
            amount: log.amount,
            currency: log.currency,
            metadata: log.metadata,
            request_id: log.request_id,
            created_at: log.created_at,
            completed_at: log.completed_at,
        }
    }
}

#[derive(Debug, Serialize)]
pub struct LogPage<T> {
    pub items: Vec<T>,
    pub limit: i64,
    pub offset: i64,
}
