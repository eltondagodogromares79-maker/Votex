use async_trait::async_trait;
use chrono::{DateTime, Utc};
use core_infra::AppError;
use rust_decimal::Decimal;
use serde_json::Value;
use sqlx::{FromRow, PgPool};
use uuid::Uuid;

use crate::{
    application::ports::activity_log_workflow::ActivityLogWorkflow,
    domain::activity_logs::{AuditLog, AuditLogFilter, TransactionLog, TransactionLogFilter},
};

pub struct PostgresActivityLogWorkflow {
    pool: PgPool,
}

impl PostgresActivityLogWorkflow {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[derive(FromRow)]
struct AuditLogRow {
    id: Uuid,
    organization_id: Option<Uuid>,
    organization_name: Option<String>,
    pageant_id: Option<Uuid>,
    actor_user_id: Option<Uuid>,
    actor_email: Option<String>,
    actor_name: Option<String>,
    action: String,
    resource_type: String,
    resource_id: Option<Uuid>,
    before_data: Option<Value>,
    after_data: Option<Value>,
    request_id: Option<Uuid>,
    ip_address: Option<String>,
    user_agent: Option<String>,
    success: bool,
    failure_reason: Option<String>,
    created_at: DateTime<Utc>,
}

impl From<AuditLogRow> for AuditLog {
    fn from(row: AuditLogRow) -> Self {
        Self {
            id: row.id,
            organization_id: row.organization_id,
            organization_name: row.organization_name,
            pageant_id: row.pageant_id,
            actor_user_id: row.actor_user_id,
            actor_email: row.actor_email,
            actor_name: row.actor_name,
            action: row.action,
            resource_type: row.resource_type,
            resource_id: row.resource_id,
            before_data: row.before_data,
            after_data: row.after_data,
            request_id: row.request_id,
            ip_address: row.ip_address,
            user_agent: row.user_agent,
            success: row.success,
            failure_reason: row.failure_reason,
            created_at: row.created_at,
        }
    }
}

#[derive(FromRow)]
struct TransactionLogRow {
    id: Uuid,
    transaction_type: String,
    organization_id: Option<Uuid>,
    organization_name: Option<String>,
    pageant_id: Option<Uuid>,
    actor_user_id: Option<Uuid>,
    actor_email: Option<String>,
    actor_name: Option<String>,
    reference_type: Option<String>,
    reference_id: Option<Uuid>,
    status: String,
    amount: Option<Decimal>,
    currency: Option<String>,
    metadata: Value,
    request_id: Option<Uuid>,
    created_at: DateTime<Utc>,
    completed_at: Option<DateTime<Utc>>,
}

impl From<TransactionLogRow> for TransactionLog {
    fn from(row: TransactionLogRow) -> Self {
        Self {
            id: row.id,
            transaction_type: row.transaction_type,
            organization_id: row.organization_id,
            organization_name: row.organization_name,
            pageant_id: row.pageant_id,
            actor_user_id: row.actor_user_id,
            actor_email: row.actor_email,
            actor_name: row.actor_name,
            reference_type: row.reference_type,
            reference_id: row.reference_id,
            status: row.status,
            amount: row.amount,
            currency: row.currency.map(|currency| currency.trim().to_owned()),
            metadata: row.metadata,
            request_id: row.request_id,
            created_at: row.created_at,
            completed_at: row.completed_at,
        }
    }
}

const AUDIT_COLUMNS: &str = "log.id, log.organization_id, organization.name AS organization_name, \
    log.pageant_id, log.actor_user_id, actor.email::text AS actor_email, \
    NULLIF(concat_ws(' ', actor.first_name, actor.last_name), '') AS actor_name, \
    log.action, log.resource_type, log.resource_id, log.before_data, log.after_data, \
    log.request_id, log.ip_address::text AS ip_address, log.user_agent, log.success, \
    log.failure_reason, log.created_at";
const AUDIT_FROM: &str = "FROM audit_logs log \
    LEFT JOIN organizations organization ON organization.id = log.organization_id \
    LEFT JOIN users actor ON actor.id = log.actor_user_id";

const TRANSACTION_COLUMNS: &str = "log.id, log.transaction_type::text AS transaction_type, \
    log.organization_id, organization.name AS organization_name, log.pageant_id, \
    log.actor_user_id, actor.email::text AS actor_email, \
    NULLIF(concat_ws(' ', actor.first_name, actor.last_name), '') AS actor_name, \
    log.reference_type, log.reference_id, log.status::text AS status, log.amount, \
    log.currency::text AS currency, log.metadata, log.request_id, log.created_at, log.completed_at";
const TRANSACTION_FROM: &str = "FROM transaction_logs log \
    LEFT JOIN organizations organization ON organization.id = log.organization_id \
    LEFT JOIN users actor ON actor.id = log.actor_user_id";

#[async_trait]
impl ActivityLogWorkflow for PostgresActivityLogWorkflow {
    async fn list_audit_logs(&self, filter: AuditLogFilter) -> Result<Vec<AuditLog>, AppError> {
        let query = format!(
            "SELECT {AUDIT_COLUMNS} {AUDIT_FROM} \
             WHERE ($1::uuid IS NULL OR log.organization_id = $1) \
               AND ($2::uuid IS NULL OR log.pageant_id = $2) \
               AND ($3::uuid IS NULL OR log.actor_user_id = $3) \
               AND ($4::text IS NULL OR log.action = $4) \
               AND ($5::text IS NULL OR log.resource_type = $5) \
               AND ($6::boolean IS NULL OR log.success = $6) \
               AND ($7::timestamptz IS NULL OR log.created_at >= $7) \
               AND ($8::timestamptz IS NULL OR log.created_at < $8) \
             ORDER BY log.created_at DESC, log.id DESC LIMIT $9 OFFSET $10"
        );
        let rows = sqlx::query_as::<_, AuditLogRow>(&query)
            .bind(filter.organization_id)
            .bind(filter.pageant_id)
            .bind(filter.actor_user_id)
            .bind(filter.action)
            .bind(filter.resource_type)
            .bind(filter.success)
            .bind(filter.from)
            .bind(filter.to)
            .bind(filter.limit)
            .bind(filter.offset)
            .fetch_all(&self.pool)
            .await
            .map_err(database_error)?;
        Ok(rows.into_iter().map(AuditLog::from).collect())
    }

    async fn get_audit_log(&self, id: Uuid) -> Result<AuditLog, AppError> {
        let query = format!("SELECT {AUDIT_COLUMNS} {AUDIT_FROM} WHERE log.id = $1");
        let row = sqlx::query_as::<_, AuditLogRow>(&query)
            .bind(id)
            .fetch_optional(&self.pool)
            .await
            .map_err(database_error)?
            .ok_or_else(|| AppError::NotFound("audit log".to_owned()))?;
        Ok(row.into())
    }

    async fn list_transaction_logs(
        &self,
        filter: TransactionLogFilter,
    ) -> Result<Vec<TransactionLog>, AppError> {
        let query = format!(
            "SELECT {TRANSACTION_COLUMNS} {TRANSACTION_FROM} \
             WHERE ($1::uuid IS NULL OR log.organization_id = $1) \
               AND ($2::uuid IS NULL OR log.pageant_id = $2) \
               AND ($3::uuid IS NULL OR log.actor_user_id = $3) \
               AND ($4::text IS NULL OR log.transaction_type::text = $4) \
               AND ($5::text IS NULL OR log.status::text = $5) \
               AND ($6::text IS NULL OR log.reference_type = $6) \
               AND ($7::uuid IS NULL OR log.reference_id = $7) \
               AND ($8::timestamptz IS NULL OR log.created_at >= $8) \
               AND ($9::timestamptz IS NULL OR log.created_at < $9) \
             ORDER BY log.created_at DESC, log.id DESC LIMIT $10 OFFSET $11"
        );
        let rows = sqlx::query_as::<_, TransactionLogRow>(&query)
            .bind(filter.organization_id)
            .bind(filter.pageant_id)
            .bind(filter.actor_user_id)
            .bind(filter.transaction_type)
            .bind(filter.status)
            .bind(filter.reference_type)
            .bind(filter.reference_id)
            .bind(filter.from)
            .bind(filter.to)
            .bind(filter.limit)
            .bind(filter.offset)
            .fetch_all(&self.pool)
            .await
            .map_err(database_error)?;
        Ok(rows.into_iter().map(TransactionLog::from).collect())
    }

    async fn get_transaction_log(&self, id: Uuid) -> Result<TransactionLog, AppError> {
        let query = format!("SELECT {TRANSACTION_COLUMNS} {TRANSACTION_FROM} WHERE log.id = $1");
        let row = sqlx::query_as::<_, TransactionLogRow>(&query)
            .bind(id)
            .fetch_optional(&self.pool)
            .await
            .map_err(database_error)?
            .ok_or_else(|| AppError::NotFound("transaction log".to_owned()))?;
        Ok(row.into())
    }
}

fn database_error(error: sqlx::Error) -> AppError {
    AppError::Database(Box::new(error))
}
