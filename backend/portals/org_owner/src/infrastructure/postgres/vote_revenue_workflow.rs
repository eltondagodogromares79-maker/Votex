use crate::{
    application::ports::vote_revenue_workflow::VoteRevenueWorkflow,
    domain::vote_revenue::{
        CandidateVoteRevenue, PageantVoteRevenue, VoteRevenueReport, VoteRevenueTotal,
    },
};
use async_trait::async_trait;
use chrono::{DateTime, Utc};
use core_infra::AppError;
use rust_decimal::Decimal;
use sqlx::{FromRow, PgPool};
use uuid::Uuid;

pub struct PostgresVoteRevenueWorkflow {
    pool: PgPool,
}
impl PostgresVoteRevenueWorkflow {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[derive(FromRow)]
struct RevenueRow {
    report_level: i32,
    pageant_id: Option<Uuid>,
    pageant_name: Option<String>,
    candidate_id: Option<Uuid>,
    candidate_name: Option<String>,
    currency: String,
    amount: Decimal,
    completed_transactions: i64,
    votes_sold: i64,
}

#[async_trait]
impl VoteRevenueWorkflow for PostgresVoteRevenueWorkflow {
    async fn report(
        &self,
        organization_id: Uuid,
        pageant_id: Option<Uuid>,
        candidate_id: Option<Uuid>,
        from: Option<DateTime<Utc>>,
        to: Option<DateTime<Utc>>,
    ) -> Result<VoteRevenueReport, AppError> {
        let rows=sqlx::query_as::<_,RevenueRow>(r#"
            SELECT
                CASE WHEN GROUPING(pageant.id)=1 THEN 0
                     WHEN GROUPING(contestant.id)=1 THEN 1
                     ELSE 2 END AS report_level,
                pageant.id AS pageant_id,
                pageant.name AS pageant_name,
                contestant.id AS candidate_id,
                contestant.display_name AS candidate_name,
                tx.currency::text AS currency,
                SUM(tx.amount) AS amount,
                COUNT(*)::bigint AS completed_transactions,
                COALESCE(SUM(vote.quantity) FILTER (WHERE vote.status='VALID'),0)::bigint AS votes_sold
            FROM transaction_logs tx
            INNER JOIN pageants pageant
                ON pageant.id=tx.pageant_id
               AND pageant.organization_id=tx.organization_id
            INNER JOIN audience_vote_transactions vote
                ON tx.reference_type='AUDIENCE_VOTE'
               AND vote.id=tx.reference_id
            INNER JOIN contestants contestant
                ON contestant.id=vote.contestant_id
               AND contestant.pageant_id=pageant.id
            WHERE tx.organization_id=$1
              AND tx.transaction_type='VOTE'::business_transaction_type
              AND tx.status='COMPLETED'::business_transaction_status
              AND tx.amount IS NOT NULL
              AND tx.currency IS NOT NULL
              AND ($2::uuid IS NULL OR pageant.id=$2)
              AND ($3::uuid IS NULL OR contestant.id=$3)
              AND ($4::timestamptz IS NULL OR COALESCE(tx.completed_at,tx.created_at)>=$4)
              AND ($5::timestamptz IS NULL OR COALESCE(tx.completed_at,tx.created_at)<$5)
            GROUP BY GROUPING SETS (
                (tx.currency),
                (pageant.id,pageant.name,tx.currency),
                (pageant.id,pageant.name,contestant.id,contestant.display_name,tx.currency)
            )
            ORDER BY report_level,currency,pageant_name,candidate_name
        "#).bind(organization_id).bind(pageant_id).bind(candidate_id).bind(from).bind(to)
            .fetch_all(&self.pool).await.map_err(database_error)?;
        let mut report = VoteRevenueReport {
            totals_by_currency: Vec::new(),
            pageants: Vec::new(),
            candidates: Vec::new(),
        };
        for row in rows {
            let currency = row.currency.trim().to_owned();
            match row.report_level {
                0 => report.totals_by_currency.push(VoteRevenueTotal {
                    currency,
                    amount: row.amount,
                    completed_transactions: row.completed_transactions,
                    votes_sold: row.votes_sold,
                }),
                1 => {
                    if let (Some(pageant_id), Some(pageant_name)) =
                        (row.pageant_id, row.pageant_name)
                    {
                        report.pageants.push(PageantVoteRevenue {
                            pageant_id,
                            pageant_name,
                            currency,
                            amount: row.amount,
                            completed_transactions: row.completed_transactions,
                            votes_sold: row.votes_sold,
                        });
                    }
                }
                2 => {
                    if let (
                        Some(pageant_id),
                        Some(pageant_name),
                        Some(candidate_id),
                        Some(candidate_name),
                    ) = (
                        row.pageant_id,
                        row.pageant_name,
                        row.candidate_id,
                        row.candidate_name,
                    ) {
                        report.candidates.push(CandidateVoteRevenue {
                            pageant_id,
                            pageant_name,
                            candidate_id,
                            candidate_name,
                            currency,
                            amount: row.amount,
                            completed_transactions: row.completed_transactions,
                            votes_sold: row.votes_sold,
                        });
                    }
                }
                _ => {}
            }
        }
        Ok(report)
    }
}

fn database_error(error: sqlx::Error) -> AppError {
    AppError::Database(Box::new(error))
}
