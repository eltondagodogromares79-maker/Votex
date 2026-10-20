use async_trait::async_trait;
use core_infra::AppError;
use rust_decimal::Decimal;
use sqlx::{FromRow, PgPool};
use uuid::Uuid;

use crate::{
    application::ports::subscription_plan_workflow::SubscriptionPlanWorkflow,
    domain::subscription_plan::{SubscriptionPlan, SubscriptionPlanKind},
};

pub struct PostgresSubscriptionPlanWorkflow {
    pool: PgPool,
}

impl PostgresSubscriptionPlanWorkflow {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[derive(FromRow)]
struct SubscriptionPlanRow {
    id: Uuid,
    code: String,
    name: String,
    kind: String,
    price_amount: Decimal,
    currency: String,
    billing_interval_months: Option<i32>,
    max_pageants: Option<i32>,
    max_tabulator_users: Option<i32>,
    max_judges_per_pageant: Option<i32>,
    max_rounds_per_pageant: Option<i32>,
    max_categories_per_round: Option<i32>,
    public_voting_enabled: bool,
    customization_enabled: bool,
    is_active: bool,
}

impl TryFrom<SubscriptionPlanRow> for SubscriptionPlan {
    type Error = AppError;

    fn try_from(row: SubscriptionPlanRow) -> Result<Self, Self::Error> {
        let kind = match row.kind.as_str() {
            "ONE_TIME" => SubscriptionPlanKind::OneTime,
            "PREMIUM" => SubscriptionPlanKind::Premium,
            "CUSTOM" => SubscriptionPlanKind::Custom,
            _ => {
                return Err(AppError::Configuration(
                    "unknown subscription plan kind".to_owned(),
                ));
            }
        };
        Ok(Self {
            id: row.id,
            code: row.code,
            name: row.name,
            kind,
            price_amount: row.price_amount,
            currency: row.currency.trim().to_owned(),
            billing_interval_months: row.billing_interval_months,
            max_pageants: row.max_pageants,
            max_tabulator_users: row.max_tabulator_users,
            max_judges_per_pageant: row.max_judges_per_pageant,
            max_rounds_per_pageant: row.max_rounds_per_pageant,
            max_categories_per_round: row.max_categories_per_round,
            public_voting_enabled: row.public_voting_enabled,
            customization_enabled: row.customization_enabled,
            is_active: row.is_active,
        })
    }
}

const COLUMNS: &str = "id, code, name, kind::text AS kind, price_amount, currency, \
    billing_interval_months, max_pageants, max_tabulator_users, \
    max_judges_per_pageant, max_rounds_per_pageant, max_categories_per_round, \
    public_voting_enabled, customization_enabled, is_active";

#[async_trait]
impl SubscriptionPlanWorkflow for PostgresSubscriptionPlanWorkflow {
    async fn list(&self) -> Result<Vec<SubscriptionPlan>, AppError> {
        let query =
            format!("SELECT {COLUMNS} FROM subscription_plans ORDER BY is_active DESC, name, code");
        let rows = sqlx::query_as::<_, SubscriptionPlanRow>(&query)
            .fetch_all(&self.pool)
            .await
            .map_err(database_error)?;
        rows.into_iter().map(TryInto::try_into).collect()
    }

    async fn get(&self, id: Uuid) -> Result<SubscriptionPlan, AppError> {
        let query = format!("SELECT {COLUMNS} FROM subscription_plans WHERE id = $1");
        let row = sqlx::query_as::<_, SubscriptionPlanRow>(&query)
            .bind(id)
            .fetch_optional(&self.pool)
            .await
            .map_err(database_error)?
            .ok_or_else(|| AppError::NotFound("subscription plan".to_owned()))?;
        row.try_into()
    }

    async fn create(&self, plan: SubscriptionPlan) -> Result<SubscriptionPlan, AppError> {
        let query = format!(
            "INSERT INTO subscription_plans \
             (id, code, name, kind, price_amount, currency, billing_interval_months, \
              max_pageants, max_tabulator_users, \
              max_judges_per_pageant, max_rounds_per_pageant, max_categories_per_round, \
              public_voting_enabled, customization_enabled, is_active) \
             VALUES ($1,$2,$3,$4::subscription_plan_kind,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) \
             RETURNING {COLUMNS}"
        );
        let row = sqlx::query_as::<_, SubscriptionPlanRow>(&query)
            .bind(plan.id)
            .bind(&plan.code)
            .bind(&plan.name)
            .bind(plan.kind.as_db_str())
            .bind(plan.price_amount)
            .bind(&plan.currency)
            .bind(plan.billing_interval_months)
            .bind(plan.max_pageants)
            .bind(plan.max_tabulator_users)
            .bind(plan.max_judges_per_pageant)
            .bind(plan.max_rounds_per_pageant)
            .bind(plan.max_categories_per_round)
            .bind(plan.public_voting_enabled)
            .bind(plan.customization_enabled)
            .bind(plan.is_active)
            .fetch_one(&self.pool)
            .await
            .map_err(map_write_error)?;
        row.try_into()
    }

    async fn update(&self, plan: SubscriptionPlan) -> Result<SubscriptionPlan, AppError> {
        let query = format!(
            "UPDATE subscription_plans SET \
             code = $2, name = $3, kind = $4::subscription_plan_kind, \
             price_amount = $5, currency = $6, billing_interval_months = $7, \
             max_pageants = $8, max_tabulator_users = $9, \
             max_judges_per_pageant = $10, max_rounds_per_pageant = $11, \
             max_categories_per_round = $12, \
             public_voting_enabled = $13, customization_enabled = $14, is_active = $15 \
             WHERE id = $1 RETURNING {COLUMNS}"
        );
        let row = sqlx::query_as::<_, SubscriptionPlanRow>(&query)
            .bind(plan.id)
            .bind(&plan.code)
            .bind(&plan.name)
            .bind(plan.kind.as_db_str())
            .bind(plan.price_amount)
            .bind(&plan.currency)
            .bind(plan.billing_interval_months)
            .bind(plan.max_pageants)
            .bind(plan.max_tabulator_users)
            .bind(plan.max_judges_per_pageant)
            .bind(plan.max_rounds_per_pageant)
            .bind(plan.max_categories_per_round)
            .bind(plan.public_voting_enabled)
            .bind(plan.customization_enabled)
            .bind(plan.is_active)
            .fetch_optional(&self.pool)
            .await
            .map_err(map_write_error)?
            .ok_or_else(|| AppError::NotFound("subscription plan".to_owned()))?;
        row.try_into()
    }

    async fn deactivate(&self, id: Uuid) -> Result<(), AppError> {
        let changed = sqlx::query_scalar::<_, Uuid>(
            "UPDATE subscription_plans SET is_active = FALSE \
             WHERE id = $1 AND is_active = TRUE RETURNING id",
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .map_err(database_error)?;
        changed
            .map(|_| ())
            .ok_or_else(|| AppError::NotFound("active subscription plan".to_owned()))
    }
}

fn map_write_error(error: sqlx::Error) -> AppError {
    if let sqlx::Error::Database(db_err) = &error {
        if db_err.code().as_deref() == Some("23505")
            && db_err
                .constraint()
                .is_some_and(|n| n == "subscription_plans_code_key")
        {
            return AppError::Conflict(
                "a subscription plan with this code already exists".to_owned(),
            );
        }
    }
    database_error(error)
}

fn database_error(error: sqlx::Error) -> AppError {
    AppError::Database(Box::new(error))
}
