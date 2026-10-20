use crate::{
    application::ports::subscription_workflow::SubscriptionWorkflow,
    domain::subscription::{
        AdminSubscriptionAction, AdminSubscriptionDetails, AdminSubscriptionPayment, AvailablePlan,
        OrganizationPlanUsage, OrganizationSubscription, PageantResourceUsage,
        PendingSubscriptionPayment, SubscriptionPaymentProof,
    },
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

#[derive(FromRow)]
struct PlanUsageRow {
    plan_name: String,
    subscription_status: String,
    max_pageants: Option<i32>,
    max_tabulator_users: Option<i32>,
    max_judges_per_pageant: Option<i32>,
    max_rounds_per_pageant: Option<i32>,
    max_categories_per_round: Option<i32>,
}

#[derive(FromRow)]
struct PageantUsageRow {
    pageant_id: Uuid,
    pageant_name: String,
    judges_used: i64,
    rounds_used: i64,
    categories_used: i64,
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

#[derive(FromRow)]
struct PaymentProofRow {
    id: Uuid,
    subscription_id: Uuid,
    organization_id: Uuid,
    organization_name: String,
    plan_name: String,
    amount: Decimal,
    amount_paid: Decimal,
    currency: String,
    payment_method: String,
    reference_number: String,
    proof_url: Option<String>,
    status: String,
    submitted_at: chrono::DateTime<chrono::Utc>,
    reviewed_at: Option<chrono::DateTime<chrono::Utc>>,
    review_note: Option<String>,
    revoked_at: Option<chrono::DateTime<chrono::Utc>>,
    revocation_note: Option<String>,
}

#[derive(FromRow)]
struct AdminOrganizationRow {
    id: Uuid,
    name: String,
    slug: String,
    owner_id: Uuid,
    owner_first_name: String,
    owner_last_name: String,
    owner_email: String,
}

#[derive(FromRow)]
struct AdminPaymentRow {
    id: Uuid,
    amount: Decimal,
    currency: String,
    status: String,
    payment_method: Option<String>,
    reference_number: Option<String>,
    created_at: chrono::DateTime<chrono::Utc>,
    paid_at: Option<chrono::DateTime<chrono::Utc>>,
}

#[derive(FromRow)]
struct AdminSubscriptionActionRow {
    id: Uuid,
    action: String,
    reason: Option<String>,
    admin_name: String,
    created_at: chrono::DateTime<chrono::Utc>,
}

impl From<PaymentProofRow> for SubscriptionPaymentProof {
    fn from(row: PaymentProofRow) -> Self {
        Self {
            id: row.id,
            subscription_id: row.subscription_id,
            organization_id: row.organization_id,
            organization_name: row.organization_name,
            plan_name: row.plan_name,
            amount: row.amount,
            amount_paid: row.amount_paid,
            currency: row.currency.trim().to_owned(),
            payment_method: row.payment_method,
            reference_number: row.reference_number,
            proof_url: row.proof_url,
            status: row.status,
            submitted_at: row.submitted_at,
            reviewed_at: row.reviewed_at,
            review_note: row.review_note,
            revoked_at: row.revoked_at,
            revocation_note: row.revocation_note,
        }
    }
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
const PAYMENT_PROOF_SELECT: &str = "SELECT proof.id, proof.subscription_id, payment.organization_id, org.name AS organization_name, plan.name AS plan_name, payment.amount, proof.amount_paid, payment.currency::text AS currency, proof.payment_method, proof.reference_number, proof.proof_url, proof.status, proof.created_at AS submitted_at, proof.reviewed_at, proof.review_note, proof.revoked_at, proof.revocation_note FROM subscription_payment_proofs proof JOIN payment_transactions payment ON payment.id=proof.payment_transaction_id JOIN organizations org ON org.id=payment.organization_id JOIN organization_subscriptions sub ON sub.id=proof.subscription_id JOIN subscription_plans plan ON plan.id=sub.plan_id";

#[async_trait]
impl SubscriptionWorkflow for PostgresSubscriptionWorkflow {
    async fn list_plans(&self) -> Result<Vec<AvailablePlan>, AppError> {
        let rows = sqlx::query_as::<_, PlanRow>(
            "SELECT id, code, name, kind::text AS kind, price_amount, currency::text AS currency, \
             billing_interval_months, max_pageants, max_tabulator_users, \
             max_judges_per_pageant, max_rounds_per_pageant, max_categories_per_round, \
             public_voting_enabled, customization_enabled \
             FROM subscription_plans WHERE is_active ORDER BY price_amount, name",
        )
        .fetch_all(&self.pool)
        .await
        .map_err(db)?;
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
    async fn usage(&self, org: Uuid) -> Result<OrganizationPlanUsage, AppError> {
        let plan = sqlx::query_as::<_, PlanUsageRow>(
            "SELECT plan.name AS plan_name, subscription.status::text AS subscription_status, \
             plan.max_pageants, plan.max_tabulator_users, plan.max_judges_per_pageant, \
             plan.max_rounds_per_pageant, plan.max_categories_per_round \
             FROM organization_subscriptions subscription \
             INNER JOIN subscription_plans plan ON plan.id = subscription.plan_id \
             WHERE subscription.organization_id = $1 \
               AND subscription.status IN ('TRIALING','ACTIVE','PAST_DUE','PAUSED') \
             ORDER BY subscription.created_at DESC, subscription.id DESC LIMIT 1",
        )
        .bind(org)
        .fetch_optional(&self.pool)
        .await
        .map_err(db)?;

        let pageants = sqlx::query_as::<_, PageantUsageRow>(
            r#"
            SELECT pageant.id AS pageant_id, pageant.name AS pageant_name,
                   (SELECT COUNT(DISTINCT assignment.user_id)
                    FROM pageant_member_roles assignment
                    INNER JOIN roles assigned_role ON assigned_role.id = assignment.role_id
                    WHERE assignment.pageant_id = pageant.id AND assignment.is_active = TRUE
                      AND assigned_role.code = 'PAGEANT_JUDGE'
                      AND assigned_role.scope = 'PAGEANT'::role_scope AND assigned_role.is_active = TRUE
                   ) AS judges_used,
                   (SELECT COUNT(*) FROM pageant_rounds round WHERE round.pageant_id = pageant.id) AS rounds_used,
                   (SELECT COUNT(*) FROM pageant_categories category
                    WHERE category.pageant_id = pageant.id AND category.is_active = TRUE
                   ) AS categories_used
            FROM pageants pageant
            WHERE pageant.organization_id = $1 AND pageant.status <> 'ARCHIVED'::pageant_status
            ORDER BY pageant.created_at DESC, pageant.id
            "#,
        )
        .bind(org)
        .fetch_all(&self.pool)
        .await
        .map_err(db)?
        .into_iter()
        .map(|row| PageantResourceUsage {
            pageant_id: row.pageant_id,
            pageant_name: row.pageant_name,
            judges_used: row.judges_used,
            rounds_used: row.rounds_used,
            categories_used: row.categories_used,
        })
        .collect::<Vec<_>>();

        let pageants_used = sqlx::query_scalar::<_, i64>(
            "SELECT COUNT(*) FROM pageants WHERE organization_id = $1 \
             AND (status <> 'ARCHIVED'::pageant_status OR configuration_started_at IS NOT NULL)",
        )
        .bind(org)
        .fetch_one(&self.pool)
        .await
        .map_err(db)?;

        let has_created_pageant = sqlx::query_scalar::<_, bool>(
            "SELECT EXISTS(SELECT 1 FROM pageants WHERE organization_id = $1)",
        )
        .bind(org)
        .fetch_one(&self.pool)
        .await
        .map_err(db)?;

        let tabulator_users_used = sqlx::query_scalar::<_, i64>(
            "SELECT COUNT(DISTINCT assignment.user_id) FROM pageant_member_roles assignment \
             INNER JOIN pageants pageant ON pageant.id = assignment.pageant_id \
             INNER JOIN roles assigned_role ON assigned_role.id = assignment.role_id \
             WHERE pageant.organization_id = $1 AND pageant.status <> 'ARCHIVED'::pageant_status \
               AND assignment.is_active = TRUE AND assigned_role.code = 'PAGEANT_TABULATOR' \
               AND assigned_role.scope = 'PAGEANT'::role_scope AND assigned_role.is_active = TRUE",
        )
        .bind(org)
        .fetch_one(&self.pool)
        .await
        .map_err(db)?;

        Ok(OrganizationPlanUsage {
            plan_name: plan.as_ref().map(|row| row.plan_name.clone()),
            subscription_status: plan.as_ref().map(|row| row.subscription_status.clone()),
            has_created_pageant,
            pageants_used,
            max_pageants: plan.as_ref().and_then(|row| row.max_pageants),
            tabulator_users_used,
            max_tabulator_users: plan.as_ref().and_then(|row| row.max_tabulator_users),
            max_judges_per_pageant: plan.as_ref().and_then(|row| row.max_judges_per_pageant),
            max_rounds_per_pageant: plan.as_ref().and_then(|row| row.max_rounds_per_pageant),
            max_categories_per_round: plan.as_ref().and_then(|row| row.max_categories_per_round),
            pageants,
        })
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
        payment_method: Option<&str>,
        reference_number: Option<&str>,
        amount_paid: Option<Decimal>,
        proof_url: Option<&str>,
        automated: bool,
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
        // Keep this a plain SELECT: PostgreSQL applies UPDATE RLS policies to
        // SELECT ... FOR SHARE, which would hide active plans from org owners
        // because only platform admins may update subscription plans.
        let plan=sqlx::query_as::<_,PlanRow>("SELECT id, code, name, kind::text AS kind, price_amount, currency::text AS currency, billing_interval_months, max_pageants, max_tabulator_users, max_judges_per_pageant, max_rounds_per_pageant, max_categories_per_round, public_voting_enabled, customization_enabled FROM subscription_plans WHERE id=$1 AND is_active")
            .bind(plan_id).fetch_optional(&mut *tx).await.map_err(db)?.ok_or_else(||AppError::NotFound("active subscription plan".to_owned()))?;
        let occupied=sqlx::query_scalar::<_,bool>("SELECT EXISTS(SELECT 1 FROM organization_subscriptions WHERE organization_id=$1 AND status IN ('TRIALING','ACTIVE','PAST_DUE','PAUSED','PENDING_PAYMENT'))")
            .bind(org).fetch_one(&mut *tx).await.map_err(db)?;
        if occupied {
            if automated {
                let pending_sql = format!(
                    "{SUBSCRIPTION_SELECT} WHERE s.organization_id=$1 AND s.plan_id=$2 AND s.status='PENDING_PAYMENT' AND EXISTS (SELECT 1 FROM payment_transactions payment WHERE payment.subscription_id=s.id AND payment.provider='PAYMONGO') ORDER BY s.created_at DESC LIMIT 1"
                );
                if let Some(row) = sqlx::query_as::<_, SubscriptionRow>(&pending_sql)
                    .bind(org)
                    .bind(plan_id)
                    .fetch_optional(&mut *tx)
                    .await
                    .map_err(db)?
                {
                    tx.commit().await.map_err(db)?;
                    return Ok(row.into());
                }
            }
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
            let payment_id = Uuid::new_v4();
            let (method, reference) = if automated {
                ("PAYMONGO", None)
            } else {
                let method = payment_method.ok_or_else(|| {
                    AppError::BadRequest(
                        "Choose GCash, Maya, or MariBank before subscribing.".into(),
                    )
                })?;
                let reference = reference_number
                    .map(str::trim)
                    .filter(|value| !value.is_empty())
                    .ok_or_else(|| {
                        AppError::BadRequest("Payment reference number is required.".into())
                    })?;
                let paid = amount_paid
                    .ok_or_else(|| AppError::BadRequest("Amount paid is required.".into()))?;
                if paid != plan.price_amount {
                    return Err(AppError::BadRequest(format!(
                        "Amount paid must match the plan price of {} {}.",
                        plan.currency.trim(),
                        plan.price_amount
                    )));
                }
                (method, Some(reference))
            };
            sqlx::query("INSERT INTO payment_transactions (id,organization_id,subscription_id,amount,currency,status,idempotency_key,provider,provider_transaction_id,metadata) VALUES ($1,$2,$3,$4,$5,'PENDING',$6,$7,$8,'{\"source\":\"organization_subscription_request\"}'::jsonb)")
                .bind(payment_id).bind(org).bind(subscription_id).bind(plan.price_amount).bind(plan.currency.trim()).bind(idempotency_key).bind(method).bind(reference).execute(&mut *tx).await.map_err(|error| match &error {
                    sqlx::Error::Database(db_error) if db_error.code().as_deref() == Some("23505") => AppError::Conflict("That payment reference number has already been submitted.".into()),
                    _ => db(error),
                })?;
            if !automated {
                let paid = amount_paid.expect("manual payment amount was validated");
                sqlx::query("INSERT INTO subscription_payment_proofs (subscription_id,payment_transaction_id,payment_method,reference_number,amount_paid,proof_url) VALUES ($1,$2,$3,$4,$5,$6)")
                    .bind(subscription_id).bind(payment_id).bind(method).bind(reference.expect("manual reference was validated")).bind(paid).bind(proof_url).execute(&mut *tx).await.map_err(db)?;
            }
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
    async fn pending_payment(
        &self,
        org: Uuid,
    ) -> Result<Option<PendingSubscriptionPayment>, AppError> {
        let query = format!(
            "{SUBSCRIPTION_SELECT} WHERE s.organization_id=$1 AND s.status='PENDING_PAYMENT' ORDER BY s.created_at DESC LIMIT 1"
        );
        let Some(subscription) = sqlx::query_as::<_, SubscriptionRow>(&query)
            .bind(org)
            .fetch_optional(&self.pool)
            .await
            .map_err(db)?
        else {
            return Ok(None);
        };
        let proof_query = format!(
            "{PAYMENT_PROOF_SELECT} WHERE proof.subscription_id=$1 ORDER BY proof.created_at DESC LIMIT 1"
        );
        let latest_proof = sqlx::query_as::<_, PaymentProofRow>(&proof_query)
            .bind(subscription.id)
            .fetch_optional(&self.pool)
            .await
            .map_err(db)?
            .map(Into::into);
        Ok(Some(PendingSubscriptionPayment {
            subscription: subscription.into(),
            latest_proof,
        }))
    }
    async fn submit_payment_proof(
        &self,
        org: Uuid,
        subscription_id: Uuid,
        payment_method: &str,
        reference_number: &str,
        amount_paid: Decimal,
        proof_url: Option<&str>,
    ) -> Result<SubscriptionPaymentProof, AppError> {
        let mut tx = self.pool.begin().await.map_err(db)?;
        let payment_id = sqlx::query_scalar::<_, Uuid>(
            "SELECT payment.id FROM payment_transactions payment JOIN organization_subscriptions sub ON sub.id=payment.subscription_id WHERE payment.organization_id=$1 AND sub.id=$2 AND sub.status='PENDING_PAYMENT' AND payment.status='PENDING' AND payment.checkout_session_id IS NULL AND payment.provider IS DISTINCT FROM 'PAYMONGO' FOR UPDATE OF payment, sub",
        )
        .bind(org)
        .bind(subscription_id)
        .fetch_optional(&mut *tx)
        .await
        .map_err(db)?
        .ok_or_else(|| AppError::NotFound("pending subscription payment".into()))?;

        if amount_paid <= Decimal::ZERO {
            return Err(AppError::BadRequest(
                "Amount paid must be greater than zero.".into(),
            ));
        }
        let expected_amount =
            sqlx::query_scalar::<_, Decimal>("SELECT amount FROM payment_transactions WHERE id=$1")
                .bind(payment_id)
                .fetch_one(&mut *tx)
                .await
                .map_err(db)?;
        if amount_paid != expected_amount {
            return Err(AppError::BadRequest(format!(
                "Amount paid must match the plan price of {}.",
                expected_amount
            )));
        }
        sqlx::query("INSERT INTO subscription_payment_proofs (subscription_id, payment_transaction_id, payment_method, reference_number, amount_paid, proof_url) VALUES ($1,$2,$3,$4,$5,$6)")
            .bind(subscription_id)
            .bind(payment_id)
            .bind(payment_method)
            .bind(reference_number)
            .bind(amount_paid)
            .bind(proof_url)
            .execute(&mut *tx)
            .await
            .map_err(|error| match &error {
                sqlx::Error::Database(db_error) if db_error.code().as_deref() == Some("23505") => {
                    AppError::Conflict("There is already a payment proof awaiting review.".into())
                }
                _ => db(error),
            })?;

        sqlx::query(
            "UPDATE payment_transactions SET provider=$2, provider_transaction_id=$3 WHERE id=$1",
        )
        .bind(payment_id)
        .bind(payment_method)
        .bind(reference_number)
        .execute(&mut *tx)
        .await
        .map_err(|error| match &error {
            sqlx::Error::Database(db_error) if db_error.code().as_deref() == Some("23505") => {
                AppError::Conflict(
                    "That payment reference number has already been submitted.".into(),
                )
            }
            _ => db(error),
        })?;

        let query = format!(
            "{PAYMENT_PROOF_SELECT} WHERE proof.payment_transaction_id=$1 ORDER BY proof.created_at DESC LIMIT 1"
        );
        let proof = sqlx::query_as::<_, PaymentProofRow>(&query)
            .bind(payment_id)
            .fetch_one(&mut *tx)
            .await
            .map_err(db)?;
        tx.commit().await.map_err(db)?;
        Ok(proof.into())
    }
    async fn list_pending_payment_proofs(&self) -> Result<Vec<SubscriptionPaymentProof>, AppError> {
        let query = format!(
            "{PAYMENT_PROOF_SELECT} WHERE proof.status='PENDING' ORDER BY proof.created_at ASC"
        );
        let proofs = sqlx::query_as::<_, PaymentProofRow>(&query)
            .fetch_all(&self.pool)
            .await
            .map_err(db)?;
        Ok(proofs.into_iter().map(Into::into).collect())
    }
    async fn list_payment_proof_history(&self) -> Result<Vec<SubscriptionPaymentProof>, AppError> {
        let query = format!("{PAYMENT_PROOF_SELECT} ORDER BY proof.created_at DESC LIMIT 500");
        let proofs = sqlx::query_as::<_, PaymentProofRow>(&query)
            .fetch_all(&self.pool)
            .await
            .map_err(db)?;
        Ok(proofs.into_iter().map(Into::into).collect())
    }
    async fn list_organization_payment_proof_history(
        &self,
        organization_id: Uuid,
    ) -> Result<Vec<SubscriptionPaymentProof>, AppError> {
        let query = format!(
            "{PAYMENT_PROOF_SELECT} WHERE payment.organization_id=$1 ORDER BY proof.created_at DESC LIMIT 100"
        );
        let proofs = sqlx::query_as::<_, PaymentProofRow>(&query)
            .bind(organization_id)
            .fetch_all(&self.pool)
            .await
            .map_err(db)?;
        Ok(proofs.into_iter().map(Into::into).collect())
    }
    async fn admin_subscription_details(
        &self,
        organization_id: Uuid,
    ) -> Result<AdminSubscriptionDetails, AppError> {
        let organization = sqlx::query_as::<_, AdminOrganizationRow>(
            "SELECT org.id, org.name, org.slug::text AS slug, owner.id AS owner_id, owner.first_name AS owner_first_name, owner.last_name AS owner_last_name, owner.email::text AS owner_email FROM organizations org JOIN users owner ON owner.id=org.owner_id WHERE org.id=$1",
        )
        .bind(organization_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(db)?
        .ok_or_else(|| AppError::NotFound("organization".into()))?;

        let subscription_query = format!(
            "{SUBSCRIPTION_SELECT} WHERE s.organization_id=$1 ORDER BY s.created_at DESC LIMIT 1"
        );
        let subscription = sqlx::query_as::<_, SubscriptionRow>(&subscription_query)
            .bind(organization_id)
            .fetch_optional(&self.pool)
            .await
            .map_err(db)?;
        let (payment, proof, actions) = if let Some(subscription) = subscription.as_ref() {
            let payment = sqlx::query_as::<_, AdminPaymentRow>(
                "SELECT payment.id, payment.amount, payment.currency::text AS currency, payment.status::text AS status, payment.provider AS payment_method, payment.provider_transaction_id AS reference_number, payment.created_at, payment.paid_at FROM payment_transactions payment WHERE payment.subscription_id=$1 ORDER BY payment.created_at DESC LIMIT 1",
            )
            .bind(subscription.id)
            .fetch_optional(&self.pool)
            .await
            .map_err(db)?
            .map(|row| AdminSubscriptionPayment {
                id: row.id,
                amount: row.amount,
                currency: row.currency.trim().to_owned(),
                status: row.status,
                payment_method: row.payment_method,
                reference_number: row.reference_number,
                created_at: row.created_at,
                paid_at: row.paid_at,
            });
            let proof_query = format!(
                "{PAYMENT_PROOF_SELECT} WHERE proof.subscription_id=$1 ORDER BY proof.created_at DESC LIMIT 1"
            );
            let proof = sqlx::query_as::<_, PaymentProofRow>(&proof_query)
                .bind(subscription.id)
                .fetch_optional(&self.pool)
                .await
                .map_err(db)?
                .map(Into::into);
            let actions = sqlx::query_as::<_, AdminSubscriptionActionRow>(
                "SELECT action.id, action.action, action.reason, COALESCE(NULLIF(concat_ws(' ', admin.first_name, admin.last_name), ''), 'Former admin') AS admin_name, action.created_at FROM subscription_admin_actions action LEFT JOIN users admin ON admin.id=action.admin_user_id WHERE action.subscription_id=$1 ORDER BY action.created_at DESC LIMIT 50",
            )
            .bind(subscription.id)
            .fetch_all(&self.pool)
            .await
            .map_err(db)?
            .into_iter()
            .map(|row| AdminSubscriptionAction { id: row.id, action: row.action, reason: row.reason, admin_name: row.admin_name, created_at: row.created_at })
            .collect();
            (payment, proof, actions)
        } else {
            (None, None, Vec::new())
        };

        Ok(AdminSubscriptionDetails {
            organization_id: organization.id,
            organization_name: organization.name,
            organization_slug: organization.slug,
            owner_user_id: organization.owner_id,
            owner_first_name: organization.owner_first_name,
            owner_last_name: organization.owner_last_name,
            owner_email: organization.owner_email,
            subscription: subscription.map(Into::into),
            payment,
            proof,
            actions,
        })
    }

    async fn admin_cancel_subscription(
        &self,
        subscription_id: Uuid,
        admin_user_id: Uuid,
        reason: &str,
    ) -> Result<(), AppError> {
        let mut tx = self.pool.begin().await.map_err(db)?;
        let payment_id = sqlx::query_scalar::<_, Option<Uuid>>(
            "SELECT (SELECT payment.id FROM payment_transactions payment WHERE payment.subscription_id=sub.id ORDER BY payment.created_at DESC LIMIT 1) FROM organization_subscriptions sub WHERE sub.id=$1 AND sub.status IN ('TRIALING','ACTIVE','PAST_DUE','PAUSED','PENDING_PAYMENT') FOR UPDATE",
        )
        .bind(subscription_id)
        .fetch_optional(&mut *tx)
        .await
        .map_err(db)?
        .ok_or_else(|| AppError::Conflict("This subscription is already cancelled or expired.".into()))?;
        let updated = sqlx::query("UPDATE organization_subscriptions SET status='CANCELLED', ends_at=now() WHERE id=$1 AND status IN ('TRIALING','ACTIVE','PAST_DUE','PAUSED','PENDING_PAYMENT')")
            .bind(subscription_id)
            .execute(&mut *tx)
            .await
            .map_err(db)?;
        if updated.rows_affected() == 0 {
            return Err(AppError::Conflict(
                "This subscription can no longer be cancelled.".into(),
            ));
        }
        if let Some(payment_id) = payment_id {
            sqlx::query("UPDATE payment_transactions SET status='CANCELLED' WHERE id=$1 AND status='PENDING'")
                .bind(payment_id).execute(&mut *tx).await.map_err(db)?;
        }
        let proof_id = sqlx::query_scalar::<_, Option<Uuid>>("SELECT id FROM subscription_payment_proofs WHERE subscription_id=$1 AND status='PENDING' ORDER BY created_at DESC LIMIT 1")
            .bind(subscription_id).fetch_optional(&mut *tx).await.map_err(db)?.flatten();
        if let Some(proof_id) = proof_id {
            sqlx::query("UPDATE subscription_payment_proofs SET status='REJECTED', reviewed_by=$2, reviewed_at=now(), review_note=$3 WHERE id=$1")
                .bind(proof_id).bind(admin_user_id).bind(reason.trim()).execute(&mut *tx).await.map_err(db)?;
        }
        sqlx::query("INSERT INTO subscription_admin_actions (subscription_id,payment_transaction_id,proof_id,admin_user_id,action,reason) VALUES ($1,$2,$3,$4,'CANCEL_SUBSCRIPTION',$5)")
            .bind(subscription_id).bind(payment_id).bind(proof_id).bind(admin_user_id).bind(reason.trim()).execute(&mut *tx).await.map_err(db)?;
        tx.commit().await.map_err(db)?;
        Ok(())
    }
    async fn review_payment_proof(
        &self,
        proof_id: Uuid,
        admin_user_id: Uuid,
        approved: bool,
        note: Option<&str>,
    ) -> Result<SubscriptionPaymentProof, AppError> {
        let mut tx = self.pool.begin().await.map_err(db)?;
        let payment_id = sqlx::query_scalar::<_, Uuid>(
            "SELECT payment_transaction_id FROM subscription_payment_proofs WHERE id=$1 AND status='PENDING' FOR UPDATE",
        )
        .bind(proof_id)
        .fetch_optional(&mut *tx)
        .await
        .map_err(db)?
        .ok_or_else(|| AppError::NotFound("pending subscription payment proof".into()))?;
        let subscription_id = sqlx::query_scalar::<_, Uuid>(
            "SELECT subscription_id FROM subscription_payment_proofs WHERE id=$1",
        )
        .bind(proof_id)
        .fetch_one(&mut *tx)
        .await
        .map_err(db)?;

        sqlx::query("UPDATE subscription_payment_proofs SET status=$2, reviewed_by=$3, reviewed_at=now(), review_note=$4 WHERE id=$1")
            .bind(proof_id)
            .bind(if approved { "APPROVED" } else { "REJECTED" })
            .bind(admin_user_id)
            .bind(note.map(str::trim).filter(|value| !value.is_empty()))
            .execute(&mut *tx)
            .await
            .map_err(db)?;

        if approved {
            let payment_updated = sqlx::query("UPDATE payment_transactions SET status='COMPLETED', paid_at=now() WHERE id=$1 AND status='PENDING'")
                .bind(payment_id)
                .execute(&mut *tx)
                .await
                .map_err(db)?;
            if payment_updated.rows_affected() == 0 {
                return Err(AppError::Conflict(
                    "This payment is no longer pending.".into(),
                ));
            }
            let subscription_updated = sqlx::query("UPDATE organization_subscriptions sub SET status='ACTIVE', starts_at=now(), ends_at=CASE WHEN plan.billing_interval_months IS NULL THEN NULL ELSE now()+make_interval(months=>plan.billing_interval_months) END FROM subscription_plans plan WHERE sub.id=(SELECT subscription_id FROM payment_transactions WHERE id=$1) AND plan.id=sub.plan_id AND sub.status='PENDING_PAYMENT'")
                .bind(payment_id)
                .execute(&mut *tx)
                .await
                .map_err(db)?;
            if subscription_updated.rows_affected() == 0 {
                return Err(AppError::Conflict(
                    "The subscription is no longer awaiting payment.".into(),
                ));
            }
        }

        sqlx::query("INSERT INTO subscription_admin_actions (subscription_id,payment_transaction_id,proof_id,admin_user_id,action,reason) VALUES ($1,$2,$3,$4,$5,$6)")
            .bind(subscription_id).bind(payment_id).bind(proof_id).bind(admin_user_id)
            .bind(if approved { "APPROVE_PAYMENT" } else { "REJECT_PAYMENT" })
            .bind(note.map(str::trim).filter(|value| !value.is_empty()))
            .execute(&mut *tx).await.map_err(db)?;

        let query = format!("{PAYMENT_PROOF_SELECT} WHERE proof.id=$1");
        let proof = sqlx::query_as::<_, PaymentProofRow>(&query)
            .bind(proof_id)
            .fetch_one(&mut *tx)
            .await
            .map_err(db)?;
        tx.commit().await.map_err(db)?;
        Ok(proof.into())
    }
    async fn revoke_payment_approval(
        &self,
        proof_id: Uuid,
        admin_user_id: Uuid,
        reason: &str,
    ) -> Result<SubscriptionPaymentProof, AppError> {
        let mut tx = self.pool.begin().await.map_err(db)?;
        let subscription_id = sqlx::query_scalar::<_, Uuid>(
            "SELECT proof.subscription_id FROM subscription_payment_proofs proof JOIN payment_transactions payment ON payment.id=proof.payment_transaction_id JOIN organization_subscriptions sub ON sub.id=proof.subscription_id WHERE proof.id=$1 AND proof.status='APPROVED' AND payment.status='COMPLETED' AND sub.status='ACTIVE' FOR UPDATE OF proof, payment, sub",
        )
        .bind(proof_id)
        .fetch_optional(&mut *tx)
        .await
        .map_err(db)?
        .ok_or_else(|| AppError::Conflict("Only an approved payment on an active subscription can be revoked.".into()))?;
        let payment_id = sqlx::query_scalar::<_, Uuid>(
            "SELECT payment_transaction_id FROM subscription_payment_proofs WHERE id=$1",
        )
        .bind(proof_id)
        .fetch_one(&mut *tx)
        .await
        .map_err(db)?;

        let cancelled = sqlx::query("UPDATE organization_subscriptions SET status='CANCELLED', ends_at=now() WHERE id=$1 AND status='ACTIVE'")
            .bind(subscription_id)
            .execute(&mut *tx)
            .await
            .map_err(db)?;
        if cancelled.rows_affected() == 0 {
            return Err(AppError::Conflict(
                "The subscription is no longer active.".into(),
            ));
        }

        sqlx::query("UPDATE subscription_payment_proofs SET status='REVOKED', revoked_by=$2, revoked_at=now(), revocation_note=$3 WHERE id=$1 AND status='APPROVED'")
            .bind(proof_id)
            .bind(admin_user_id)
            .bind(reason.trim())
            .execute(&mut *tx)
            .await
            .map_err(db)?;

        sqlx::query("INSERT INTO subscription_admin_actions (subscription_id,payment_transaction_id,proof_id,admin_user_id,action,reason) VALUES ($1,$2,$3,$4,'REVOKE_APPROVAL',$5)")
            .bind(subscription_id).bind(payment_id).bind(proof_id).bind(admin_user_id).bind(reason.trim())
            .execute(&mut *tx).await.map_err(db)?;

        let query = format!("{PAYMENT_PROOF_SELECT} WHERE proof.id=$1");
        let proof = sqlx::query_as::<_, PaymentProofRow>(&query)
            .bind(proof_id)
            .fetch_one(&mut *tx)
            .await
            .map_err(db)?;
        tx.commit().await.map_err(db)?;
        Ok(proof.into())
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
    async fn is_paymongo_pending_checkout(
        &self,
        organization_id: Uuid,
        subscription_id: Uuid,
    ) -> Result<bool, AppError> {
        sqlx::query_scalar::<_, bool>(
            "SELECT EXISTS (SELECT 1 FROM organization_subscriptions sub JOIN payment_transactions payment ON payment.subscription_id=sub.id WHERE sub.id=$1 AND sub.organization_id=$2 AND sub.status='PENDING_PAYMENT' AND payment.status='PENDING' AND payment.provider='PAYMONGO')",
        )
        .bind(subscription_id)
        .bind(organization_id)
        .fetch_one(&self.pool)
        .await
        .map_err(db)
    }
    async fn confirm_checkout(
        &self,
        session_id: &str,
        payment_id: Option<&str>,
    ) -> Result<bool, AppError> {
        let mut tx = self.pool.begin().await.map_err(db)?;
        let subscription_id=sqlx::query_scalar::<_,Uuid>("UPDATE payment_transactions SET status='COMPLETED',provider_transaction_id=COALESCE($2,provider_transaction_id),paid_at=now() WHERE checkout_session_id=$1 AND provider='PAYMONGO' AND status='PENDING' RETURNING subscription_id")
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
        let organization =
            sqlx::query_scalar::<_, Uuid>("SELECT id FROM organizations WHERE id = $1 FOR UPDATE")
                .bind(org)
                .fetch_optional(&mut *tx)
                .await
                .map_err(db)?
                .ok_or_else(|| AppError::NotFound("organization".to_owned()))?;
        let pageant_exists = sqlx::query_scalar::<_, bool>(
            "SELECT EXISTS(SELECT 1 FROM pageants WHERE organization_id = $1)",
        )
        .bind(organization)
        .fetch_one(&mut *tx)
        .await
        .map_err(db)?;
        if pageant_exists {
            return Err(AppError::Conflict(
                "Your subscription cannot be canceled after your organization has created a pageant.".to_owned(),
            ));
        }

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
