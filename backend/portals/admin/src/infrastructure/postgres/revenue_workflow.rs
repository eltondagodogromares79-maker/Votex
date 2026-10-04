use async_trait::async_trait;
use chrono::{DateTime, Utc};
use core_infra::AppError;
use rust_decimal::Decimal;
use sqlx::{FromRow, PgPool};
use uuid::Uuid;

use crate::{
    application::ports::revenue_workflow::RevenueWorkflow,
    domain::revenue::{OrganizationRevenue, RevenueReport, RevenueTotal},
};

pub struct PostgresRevenueWorkflow {
    pool: PgPool,
}

impl PostgresRevenueWorkflow {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[derive(FromRow)]
struct RevenueRow {
    report_level: i32,
    organization_id: Option<Uuid>,
    organization_name: Option<String>,
    currency: String,
    amount: Decimal,
    completed_transactions: i64,
}

#[async_trait]
impl RevenueWorkflow for PostgresRevenueWorkflow {
    async fn report(
        &self,
        organization_id: Option<Uuid>,
        from: Option<DateTime<Utc>>,
        to: Option<DateTime<Utc>>,
    ) -> Result<RevenueReport, AppError> {
        let rows = sqlx::query_as::<_, RevenueRow>(
            r#"
            SELECT
                CASE WHEN GROUPING(organization.id) = 1 THEN 0 ELSE 1 END AS report_level,
                organization.id AS organization_id,
                organization.name AS organization_name,
                payment.currency::text AS currency,
                SUM(payment.amount) AS amount,
                COUNT(*)::bigint AS completed_transactions
            FROM payment_transactions payment
            INNER JOIN organizations organization ON organization.id = payment.organization_id
            WHERE payment.status = 'COMPLETED'::payment_status
              AND payment.subscription_id IS NOT NULL
              AND ($1::uuid IS NULL OR payment.organization_id = $1)
              AND ($2::timestamptz IS NULL OR COALESCE(payment.paid_at, payment.updated_at) >= $2)
              AND ($3::timestamptz IS NULL OR COALESCE(payment.paid_at, payment.updated_at) < $3)
            GROUP BY GROUPING SETS (
                (payment.currency),
                (organization.id, organization.name, payment.currency)
            )
            ORDER BY report_level, currency, organization_name
            "#,
        )
        .bind(organization_id)
        .bind(from)
        .bind(to)
        .fetch_all(&self.pool)
        .await
        .map_err(database_error)?;

        let mut report = RevenueReport {
            totals_by_currency: Vec::new(),
            organizations: Vec::new(),
        };
        for row in rows {
            if row.report_level == 0 {
                report.totals_by_currency.push(RevenueTotal {
                    currency: row.currency.trim().to_owned(),
                    amount: row.amount,
                    completed_transactions: row.completed_transactions,
                });
            } else if let (Some(organization_id), Some(organization_name)) =
                (row.organization_id, row.organization_name)
            {
                report.organizations.push(OrganizationRevenue {
                    organization_id,
                    organization_name,
                    currency: row.currency.trim().to_owned(),
                    amount: row.amount,
                    completed_transactions: row.completed_transactions,
                });
            }
        }
        Ok(report)
    }
}

fn database_error(error: sqlx::Error) -> AppError {
    AppError::Database(Box::new(error))
}
