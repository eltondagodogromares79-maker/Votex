use crate::{
    application::ports::transaction_history_workflow::TransactionHistoryWorkflow,
    domain::transactions::{AudienceTransaction, TransactionPage},
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
    pageant_id: Uuid,
    pageant_name: String,
    contestant_id: Uuid,
    contestant_name: String,
    package_id: Option<Uuid>,
    package_name: Option<String>,
    vote_quantity: i32,
    amount: Decimal,
    currency: String,
    status: String,
    provider_payment_id: Option<String>,
    created_at: chrono::DateTime<chrono::Utc>,
    paid_at: Option<chrono::DateTime<chrono::Utc>>,
}

impl From<TransactionRow> for AudienceTransaction {
    fn from(row: TransactionRow) -> Self {
        Self {
            id: row.id,
            pageant_id: row.pageant_id,
            pageant_name: row.pageant_name,
            contestant_id: row.contestant_id,
            contestant_name: row.contestant_name,
            package_id: row.package_id,
            package_name: row.package_name,
            vote_quantity: row.vote_quantity,
            amount: row.amount,
            currency: row.currency.trim().to_owned(),
            status: row.status,
            provider_payment_id: row.provider_payment_id,
            created_at: row.created_at,
            paid_at: row.paid_at,
        }
    }
}

#[async_trait]
impl TransactionHistoryWorkflow for PostgresTransactionHistoryWorkflow {
    async fn list_for_user(
        &self,
        user_id: Uuid,
        page: TransactionPage,
    ) -> Result<Vec<AudienceTransaction>, AppError> {
        let rows = sqlx::query_as::<_, TransactionRow>(
            r#"
            SELECT vote.id, pageant.id AS pageant_id, pageant.name AS pageant_name,
                   contestant.id AS contestant_id, contestant.display_name AS contestant_name,
                   package.id AS package_id, package.name AS package_name,
                   vote.quantity AS vote_quantity, COALESCE(vote.amount, 0) AS amount,
                   vote.currency::text AS currency, vote.status::text AS status,
                   vote.provider_payment_id, vote.created_at, vote.paid_at
            FROM audience_vote_transactions vote
            INNER JOIN audience_voters voter ON voter.id=vote.audience_voter_id
            INNER JOIN contestants contestant ON contestant.id=vote.contestant_id
            INNER JOIN pageants pageant ON pageant.id=contestant.pageant_id
            LEFT JOIN pageant_vote_packages package ON package.id=vote.package_id
            WHERE voter.user_id=$1
            ORDER BY vote.created_at DESC, vote.id DESC
            LIMIT $2 OFFSET $3
        "#,
        )
        .bind(user_id)
        .bind(page.limit)
        .bind(page.offset)
        .fetch_all(&self.pool)
        .await
        .map_err(|error| AppError::Database(Box::new(error)))?;
        Ok(rows.into_iter().map(Into::into).collect())
    }
}
