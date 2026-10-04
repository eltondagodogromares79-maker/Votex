use crate::{
    application::ports::subscription_workflow::SubscriptionWorkflow,
    domain::subscription::{AvailablePlan, OrganizationSubscription},
};
use async_trait::async_trait;
use core_infra::AppError;
use rust_decimal::Decimal;
use sqlx::{FromRow, PgPool};
use uuid::Uuid;

pub struct PostgresSubscriptionWorkflow {
    pool: PgPool,
}
impl PostgresSubscriptionWorkflow {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[derive(FromRow)]
struct PlanRow {
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
}
impl From<PlanRow> for AvailablePlan {
    fn from(r: PlanRow) -> Self {
        Self {
            id: r.id,
            code: r.code,
            name: r.name,
            kind: r.kind,
            price_amount: r.price_amount,
            currency: r.currency.trim().to_owned(),
            billing_interval_months: r.billing_interval_months,
            max_pageants: r.max_pageants,
            max_tabulator_users: r.max_tabulator_users,
            max_judges_per_pageant: r.max_judges_per_pageant,
            max_rounds_per_pageant: r.max_rounds_per_pageant,
            max_categories_per_round: r.max_categories_per_round,
            public_voting_enabled: r.public_voting_enabled,
            customization_enabled: r.customization_enabled,
        }
    }
}
#[derive(FromRow)]
struct SubscriptionRow {
    id: Uuid,
    organization_id: Uuid,
    plan_id: Uuid,
    plan_code: String,
    plan_name: String,
    status: String,
    price_amount: Decimal,
    currency: String,
    starts_at: chrono::DateTime<chrono::Utc>,
    ends_at: Option<chrono::DateTime<chrono::Utc>>,
    created_at: chrono::DateTime<chrono::Utc>,
    payment_transaction_id: Option<Uuid>,
    checkout_url: Option<String>,
}
impl From<SubscriptionRow> for OrganizationSubscription {
    fn from(r: SubscriptionRow) -> Self {
        Self {
            id: r.id,
            organization_id: r.organization_id,
            plan_id: r.plan_id,
            plan_code: r.plan_code,
            plan_name: r.plan_name,
            status: r.status,
            price_amount: r.price_amount,
            currency: r.currency.trim().to_owned(),
            starts_at: r.starts_at,
            ends_at: r.ends_at,
            created_at: r.created_at,
            payment_transaction_id: r.payment_transaction_id,
            checkout_url: r.checkout_url,
        }
    }
}
const SUBSCRIPTION_SELECT: &str = "SELECT s.id, s.organization_id, s.plan_id, p.code AS plan_code, p.name AS plan_name, s.status::text AS status, p.price_amount, p.currency::text AS currency, s.starts_at, s.ends_at, s.created_at, (SELECT t.id FROM payment_transactions t WHERE t.subscription_id=s.id ORDER BY t.created_at DESC LIMIT 1) AS payment_transaction_id, (SELECT t.checkout_url FROM payment_transactions t WHERE t.subscription_id=s.id ORDER BY t.created_at DESC LIMIT 1) AS checkout_url FROM organization_subscriptions s JOIN subscription_plans p ON p.id=s.plan_id";

#[async_trait]
impl SubscriptionWorkflow for PostgresSubscriptionWorkflow {
    async fn list_plans(&self) -> Result<Vec<AvailablePlan>, AppError> {
        let rows = sqlx::query_as::<_, PlanRow>(
            "SELECT id, code, name, kind::text AS kind, price_amount, currency::text AS currency, \
             billing_interval_months, max_pageants, max_tabulator_users, \
             max_judges_per_pageant, max_rounds_per_pageant, max_categories_per_round, \
             public_voting_enabled, customization_enabled \
             FROM subscription_plans WHERE is_active ORDER BY price_amount, name"
        )
        .fetch_all(&self.pool).await.map_err(db)?;
        Ok(rows.into_iter().map(Into::into).collect())
    }
    async fn current(&self, org: Uuid) -> Result<Option<OrganizationSubscription>, AppError> {
        let sql = format!(
            "{SUBSCRIPTION_SELECT} WHERE s.organization_id=$1 AND s.status IN ('TRIALING','ACTIVE','PAST_DUE','PAUSED') ORDER BY s.created_at DESC LIMIT 1"
        );
        sqlx::query_as::<_, SubscriptionRow>(&sql)
            .bind(org)
            .fetch_optional(&self.pool)
            .await
            .map(|r| r.map(Into::into))
            .map_err(db)
    }
    async fn current_plan(&self, org: Uuid) -> Result<Option<AvailablePlan>, AppError> {
        let row = sqlx::query_as::<_, PlanRow>(
            "SELECT p.id, p.code, p.name, p.kind::text AS kind, p.price_amount, \
             p.currency::text AS currency, p.billing_interval_months, \
             p.max_pageants, p.max_tabulator_users, \
             p.max_judges_per_pageant, p.max_rounds_per_pageant, p.max_categories_per_round, \
             p.public_voting_enabled, p.customization_enabled \
             FROM organization_subscriptions s \
             JOIN subscription_plans p ON p.id = s.plan_id \
             WHERE s.organization_id = $1 \
               AND s.status IN ('TRIALING','ACTIVE','PAST_DUE','PAUSED') \
             ORDER BY s.created_at DESC LIMIT 1",
        )
        .bind(org)
        .fetch_optional(&self.pool)
        .await
        .map_err(db)?;
        Ok(row.map(Into::into))
    }
    async fn is_email_verified(&self, user_id: Uuid) -> Result<bool, AppError> {
        sqlx::query_scalar::<_, bool>(
            "SELECT email_verified_at IS NOT NULL FROM users WHERE id = $1",
        )
        .bind(user_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(db)
        .map(|r| r.unwrap_or(false))
    }
    async fn history(&self, org: Uuid) -> Result<Vec<OrganizationSubscription>, AppError> {
        let sql =
            format!("{SUBSCRIPTION_SELECT} WHERE s.organization_id=$1 ORDER BY s.created_at DESC");
        let rows = sqlx::query_as::<_, SubscriptionRow>(&sql)
            .bind(org)
            .fetch_all(&self.pool)
            .await
            .map_err(db)?;
        Ok(rows.into_iter().map(Into::into).collect())
    }
    async fn subscribe(
        &self,
        org: Uuid,
        plan_id: Uuid,
        idempotency_key: &str,
    ) -> Result<OrganizationSubscription, AppError> {
        let mut tx = self.pool.begin().await.map_err(db)?;
        sqlx::query("SELECT id FROM organizations WHERE id=$1 FOR UPDATE")
            .bind(org)
            .fetch_optional(&mut *tx)
            .await
            .map_err(db)?
            .ok_or_else(|| AppError::NotFound("organization".into()))?;
        let existing_sql = format!(
            "{SUBSCRIPTION_SELECT} WHERE s.id=(SELECT subscription_id FROM payment_transactions WHERE idempotency_key=$1)"
        );
        if let Some(row) = sqlx::query_as::<_, SubscriptionRow>(&existing_sql)
            .bind(idempotency_key)
            .fetch_optional(&mut *tx)
            .await
            .map_err(db)?
        {
            tx.commit().await.map_err(db)?;
            return Ok(row.into());
        }
        let plan=sqlx::query_as::<_,PlanRow>("SELECT id, code, name, kind::text AS kind, price_amount, currency::text AS currency, billing_interval_months, max_pageants, max_tabulator_users, customization_enabled FROM subscription_plans WHERE id=$1 AND is_active FOR SHARE")
            .bind(plan_id).fetch_optional(&mut *tx).await.map_err(db)?.ok_or_else(||AppError::NotFound("active subscription plan".to_owned()))?;
        let occupied=sqlx::query_scalar::<_,bool>("SELECT EXISTS(SELECT 1 FROM organization_subscriptions WHERE organization_id=$1 AND status IN ('TRIALING','ACTIVE','PAST_DUE','PAUSED','PENDING_PAYMENT'))")
            .bind(org).fetch_one(&mut *tx).await.map_err(db)?;
        if occupied {
            return Err(AppError::Conflict(
                "organization already has an active subscription or a pending subscription request"
                    .to_owned(),
            ));
        }
        let status = if plan.price_amount == Decimal::ZERO {
            "ACTIVE"
        } else {
            "PENDING_PAYMENT"
        };
        let subscription_id = Uuid::new_v4();
        sqlx::query("INSERT INTO organization_subscriptions (id,organization_id,plan_id,status,starts_at) VALUES ($1,$2,$3,$4::subscription_status,now())")
            .bind(subscription_id).bind(org).bind(plan.id).bind(status).execute(&mut *tx).await.map_err(map_write)?;
        if plan.price_amount > Decimal::ZERO {
            sqlx::query("INSERT INTO payment_transactions (id,organization_id,subscription_id,amount,currency,status,idempotency_key,metadata) VALUES ($1,$2,$3,$4,$5,'PENDING',$6,'{\"source\":\"organization_subscription_request\"}'::jsonb)")
                .bind(Uuid::new_v4()).bind(org).bind(subscription_id).bind(plan.price_amount).bind(plan.currency.trim()).bind(idempotency_key).execute(&mut *tx).await.map_err(db)?;
        }
        let sql = format!("{SUBSCRIPTION_SELECT} WHERE s.id=$1");
        let row = sqlx::query_as::<_, SubscriptionRow>(&sql)
            .bind(subscription_id)
            .fetch_one(&mut *tx)
            .await
            .map_err(db)?;
        tx.commit().await.map_err(db)?;
        Ok(row.into())
    }
    async fn attach_checkout(
        &self,
        payment_id: Uuid,
        session_id: &str,
        checkout_url: &str,
    ) -> Result<(), AppError> {
        let updated = sqlx::query("UPDATE payment_transactions SET provider='PAYMONGO',checkout_session_id=$2,checkout_url=$3 WHERE id=$1 AND status='PENDING' AND (checkout_session_id IS NULL OR checkout_session_id=$2)")
            .bind(payment_id).bind(session_id).bind(checkout_url).execute(&self.pool).await.map_err(db)?;
        if updated.rows_affected() == 0 {
            return Err(AppError::Conflict(
                "payment checkout is no longer pending".into(),
            ));
        }
        Ok(())
    }
    async fn confirm_checkout(
        &self,
        session_id: &str,
        payment_id: Option<&str>,
    ) -> Result<bool, AppError> {
        let mut tx = self.pool.begin().await.map_err(db)?;
        let subscription_id=sqlx::query_scalar::<_,Uuid>("UPDATE payment_transactions SET status='COMPLETED',provider_transaction_id=COALESCE($2,provider_transaction_id),paid_at=now() WHERE checkout_session_id=$1 AND status='PENDING' RETURNING subscription_id")
            .bind(session_id).bind(payment_id).fetch_optional(&mut *tx).await.map_err(db)?;
        let Some(subscription_id) = subscription_id else {
            tx.commit().await.map_err(db)?;
            return Ok(false);
        };
        sqlx::query("UPDATE organization_subscriptions s SET status='ACTIVE',starts_at=now(),ends_at=CASE WHEN p.billing_interval_months IS NULL THEN NULL ELSE now()+make_interval(months=>p.billing_interval_months) END FROM subscription_plans p WHERE s.id=$1 AND p.id=s.plan_id AND s.status='PENDING_PAYMENT'")
            .bind(subscription_id).execute(&mut *tx).await.map_err(db)?;
        tx.commit().await.map_err(db)?;
        Ok(true)
    }
    async fn cancel(&self, org: Uuid, id: Uuid) -> Result<(), AppError> {
        let mut tx = self.pool.begin().await.map_err(db)?;
        let result=sqlx::query("UPDATE organization_subscriptions SET status='CANCELLED' WHERE id=$1 AND organization_id=$2 AND status IN ('TRIALING','ACTIVE','PAST_DUE','PAUSED')")
            .bind(id).bind(org).execute(&mut *tx).await.map_err(db)?;
        if result.rows_affected() == 0 {
            let pending_checkout = sqlx::query_scalar::<_, bool>("SELECT EXISTS(SELECT 1 FROM organization_subscriptions WHERE id=$1 AND organization_id=$2 AND status='PENDING_PAYMENT')")
                .bind(id).bind(org).fetch_one(&mut *tx).await.map_err(db)?;
            if pending_checkout {
                return Err(AppError::Conflict(
                    "a pending PayMongo checkout cannot be canceled through this endpoint"
                        .to_owned(),
                ));
            }
            return Err(AppError::NotFound(
                "current organization subscription".to_owned(),
            ));
        }
        sqlx::query("UPDATE payment_transactions SET status='CANCELLED' WHERE subscription_id=$1 AND status='PENDING'").bind(id).execute(&mut *tx).await.map_err(db)?;
        tx.commit().await.map_err(db)?;
        Ok(())
    }
}
fn db(e: sqlx::Error) -> AppError {
    AppError::Database(Box::new(e))
}
fn map_write(e: sqlx::Error) -> AppError {
    if let sqlx::Error::Database(ref d) = e {
        if d.code().as_deref() == Some("23505") {
            return AppError::Conflict(
                "organization already has an active subscription or pending request".to_owned(),
            );
        }
    }
    db(e)
}
