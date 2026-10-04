use crate::{
    application::ports::transaction_history_workflow::TransactionHistoryWorkflow,
    domain::transaction::{OrganizationTransaction, TransactionHistoryFilter},
};
use async_trait::async_trait;
use core_infra::AppError;
use rust_decimal::Decimal;
use sqlx::{FromRow, PgPool};
use uuid::Uuid;

pub struct PostgresTransactionHistoryWorkflow {
    pool: PgPool,
}

impl PostgresTransactionHistoryWorkflow {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[derive(FromRow)]
struct TransactionRow {
    id: Uuid,
    source: String,
    transaction_type: String,
    reference_id: Option<Uuid>,
    description: String,
    pageant_id: Option<Uuid>,
    pageant_name: Option<String>,
    candidate_id: Option<Uuid>,
    candidate_name: Option<String>,
    amount: Option<Decimal>,
    currency: Option<String>,
    status: String,
    provider: Option<String>,
    provider_transaction_id: Option<String>,
    created_at: chrono::DateTime<chrono::Utc>,
    completed_at: Option<chrono::DateTime<chrono::Utc>>,
}

impl From<TransactionRow> for OrganizationTransaction {
    fn from(row: TransactionRow) -> Self {
        Self {
            id: row.id,
            source: row.source,
            transaction_type: row.transaction_type,
            reference_id: row.reference_id,
            description: row.description,
            pageant_id: row.pageant_id,
            pageant_name: row.pageant_name,
            candidate_id: row.candidate_id,
            candidate_name: row.candidate_name,
            amount: row.amount,
            currency: row.currency.map(|currency| currency.trim().to_owned()),
            status: row.status,
            provider: row.provider,
            provider_transaction_id: row.provider_transaction_id,
            created_at: row.created_at,
            completed_at: row.completed_at,
        }
    }
}

#[async_trait]
impl TransactionHistoryWorkflow for PostgresTransactionHistoryWorkflow {
    async fn list_for_organization(
        &self,
        organization_id: Uuid,
        filter: TransactionHistoryFilter,
    ) -> Result<Vec<OrganizationTransaction>, AppError> {
        let rows = sqlx::query_as::<_, TransactionRow>(r#"
            WITH organization_transactions AS (
                SELECT payment.id,
                       'PAYMENT_TRANSACTION'::text AS source,
                       CASE WHEN payment.subscription_id IS NULL THEN 'PAYMENT'
                            ELSE 'SUBSCRIPTION_PAYMENT' END::text AS transaction_type,
                       payment.subscription_id AS reference_id,
                       COALESCE('Subscription: ' || plan.name, 'Organization payment') AS description,
                       NULL::uuid AS pageant_id,
                       NULL::text AS pageant_name,
                       NULL::uuid AS candidate_id,
                       NULL::text AS candidate_name,
                       payment.amount,
                       payment.currency::text AS currency,
                       payment.status::text AS status,
                       payment.provider,
                       payment.provider_transaction_id,
                       payment.created_at,
                       payment.paid_at AS completed_at
                FROM payment_transactions payment
                LEFT JOIN organization_subscriptions subscription
                    ON subscription.id=payment.subscription_id
                LEFT JOIN subscription_plans plan ON plan.id=subscription.plan_id
                WHERE payment.organization_id=$1

                UNION ALL

                SELECT txlog.id,
                       'TRANSACTION_LOG'::text AS source,
                       txlog.transaction_type::text AS transaction_type,
                       txlog.reference_id,
                       CASE WHEN txlog.transaction_type='VOTE'::business_transaction_type
                            THEN COALESCE(pageant.name || ' vote purchase', 'Vote purchase')
                            ELSE txlog.transaction_type::text END AS description,
                       txlog.pageant_id,
                       pageant.name AS pageant_name,
                       contestant.id AS candidate_id,
                       contestant.display_name AS candidate_name,
                       txlog.amount,
                       txlog.currency::text AS currency,
                       txlog.status::text AS status,
                       txlog.metadata->>'provider' AS provider,
                       txlog.metadata->>'paymongo_payment_id' AS provider_transaction_id,
                       txlog.created_at,
                       txlog.completed_at
                FROM transaction_logs txlog
                LEFT JOIN pageants pageant ON pageant.id=txlog.pageant_id
                    AND pageant.organization_id=txlog.organization_id
                LEFT JOIN audience_vote_transactions vote
                    ON txlog.reference_type='AUDIENCE_VOTE'
                   AND vote.id=txlog.reference_id
                LEFT JOIN contestants contestant
                    ON contestant.id=vote.contestant_id
                   AND contestant.pageant_id=pageant.id
                WHERE txlog.organization_id=$1
            )
            SELECT * FROM organization_transactions
            WHERE ($2::uuid IS NULL OR pageant_id=$2)
              AND ($3::uuid IS NULL OR candidate_id=$3)
              AND ($4::timestamptz IS NULL OR COALESCE(completed_at,created_at)>=$4)
              AND ($5::timestamptz IS NULL OR COALESCE(completed_at,created_at)<$5)
            ORDER BY created_at DESC, id DESC
            LIMIT $6 OFFSET $7
        "#)
        .bind(organization_id)
        .bind(filter.pageant_id)
        .bind(filter.candidate_id)
        .bind(filter.from)
        .bind(filter.to)
        .bind(filter.limit)
        .bind(filter.offset)
        .fetch_all(&self.pool)
        .await
        .map_err(|error| AppError::Database(Box::new(error)))?;
        Ok(rows.into_iter().map(Into::into).collect())
    }
}
