use crate::{
    application::ports::voting_workflow::VotingWorkflow,
    domain::voting::{VoteCandidate, VoteCheckout, VotePackage},
};
use async_trait::async_trait;
use core_infra::AppError;
use rust_decimal::{Decimal, prelude::ToPrimitive};
use sqlx::{FromRow, PgPool};
use uuid::Uuid;

pub struct PostgresVotingWorkflow {
    pool: PgPool,
}
impl PostgresVotingWorkflow {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}
fn db(e: sqlx::Error) -> AppError {
    AppError::Database(Box::new(e))
}
#[derive(FromRow)]
struct PackageRow {
    id: Uuid,
    pageant_id: Uuid,
    name: String,
    description: Option<String>,
    vote_quantity: i32,
    price_amount: Decimal,
    currency: String,
}
#[derive(FromRow)]
struct CandidateRow {
    id: Uuid,
    contestant_number: i32,
    display_name: String,
    photo_url: Option<String>,
    biography: Option<String>,
}
#[derive(FromRow)]
struct VoteRow {
    id: Uuid,
    contestant_id: Uuid,
    package_id: Uuid,
    quantity: i32,
    amount: Decimal,
    currency: String,
    status: String,
    checkout_url: Option<String>,
}
fn vote(row: VoteRow) -> VoteCheckout {
    VoteCheckout {
        id: row.id,
        contestant_id: row.contestant_id,
        package_id: row.package_id,
        quantity: row.quantity,
        amount: row.amount,
        currency: row.currency.trim().to_owned(),
        status: row.status,
        checkout_url: row.checkout_url,
    }
}
const AUDIENCE_VOTE_SELECT: &str = "SELECT id,contestant_id,package_id,quantity,COALESCE(amount,0) AS amount,currency,status::text AS status,checkout_url FROM audience_vote_transactions";
#[async_trait]
impl VotingWorkflow for PostgresVotingWorkflow {
    async fn packages(&self, pageant: Uuid) -> Result<Vec<VotePackage>, AppError> {
        let rows=sqlx::query_as::<_,PackageRow>("SELECT p.id,p.pageant_id,p.name,p.description,p.vote_quantity,p.price_amount,p.currency::text AS currency FROM pageant_vote_packages p WHERE p.pageant_id=$1 AND p.is_active AND EXISTS(SELECT 1 FROM voting_configurations v WHERE v.pageant_id=p.pageant_id AND v.status='OPEN' AND (v.starts_at IS NULL OR v.starts_at<=now()) AND (v.ends_at IS NULL OR v.ends_at>now())) ORDER BY p.price_amount,p.vote_quantity,p.name").bind(pageant).fetch_all(&self.pool).await.map_err(db)?;
        Ok(rows
            .into_iter()
            .map(|r| VotePackage {
                id: r.id,
                pageant_id: r.pageant_id,
                name: r.name,
                description: r.description,
                vote_quantity: r.vote_quantity,
                price_amount: r.price_amount,
                currency: r.currency.trim().to_owned(),
            })
            .collect())
    }
    async fn candidates(&self, pageant: Uuid) -> Result<Vec<VoteCandidate>, AppError> {
        let rows=sqlx::query_as::<_,CandidateRow>("SELECT c.id,c.contestant_number,c.display_name,c.photo_url,c.biography FROM contestants c WHERE c.pageant_id=$1 AND c.is_active AND EXISTS(SELECT 1 FROM voting_configurations v WHERE v.pageant_id=c.pageant_id AND v.status='OPEN' AND (v.starts_at IS NULL OR v.starts_at<=now()) AND (v.ends_at IS NULL OR v.ends_at>now())) ORDER BY c.contestant_number,c.display_name").bind(pageant).fetch_all(&self.pool).await.map_err(db)?;
        Ok(rows
            .into_iter()
            .map(|r| VoteCandidate {
                id: r.id,
                contestant_number: r.contestant_number,
                display_name: r.display_name,
                photo_url: r.photo_url,
                biography: r.biography,
            })
            .collect())
    }
    async fn start_vote(
        &self,
        user: Uuid,
        pageant: Uuid,
        candidate: Uuid,
        package: Uuid,
        key: &str,
    ) -> Result<(VoteCheckout, i64, String), AppError> {
        let voter = sqlx::query_scalar::<_, Uuid>(
            "SELECT id FROM audience_voters WHERE user_id=$1 AND verification_status='VERIFIED'",
        )
        .bind(user)
        .fetch_optional(&self.pool)
        .await
        .map_err(db)?
        .ok_or(AppError::Forbidden)?;
        if let Some(existing) = sqlx::query_as::<_, VoteRow>(&format!(
            "{AUDIENCE_VOTE_SELECT} WHERE audience_voter_id=$1 AND idempotency_key=$2"
        ))
        .bind(voter)
        .bind(key)
        .fetch_optional(&self.pool)
        .await
        .map_err(db)?
        {
            if existing.contestant_id != candidate || existing.package_id != package {
                return Err(AppError::Conflict(
                    "Idempotency-Key was already used for a different vote purchase".into(),
                ));
            }
            let price_minor = (existing.amount * Decimal::from(100))
                .round()
                .to_i64()
                .ok_or(AppError::Internal)?;
            let label = format!("{} votes", existing.quantity);
            return Ok((vote(existing), price_minor, label));
        }
        let mut tx = self.pool.begin().await.map_err(db)?;
        let config=sqlx::query_as::<_,(Uuid,Option<i32>,Option<i32>)>("SELECT id,vote_limit_per_voter,vote_limit_per_contestant FROM voting_configurations WHERE pageant_id=$1 AND status='OPEN' AND (starts_at IS NULL OR starts_at<=now()) AND (ends_at IS NULL OR ends_at>now()) ORDER BY created_at DESC,id LIMIT 1 FOR UPDATE").bind(pageant).fetch_optional(&mut *tx).await.map_err(db)?.ok_or_else(||AppError::Conflict("voting is not open for this pageant".into()))?;
        if let Some(existing) = sqlx::query_as::<_, VoteRow>(&format!(
            "{AUDIENCE_VOTE_SELECT} WHERE audience_voter_id=$1 AND idempotency_key=$2"
        ))
        .bind(voter)
        .bind(key)
        .fetch_optional(&mut *tx)
        .await
        .map_err(db)?
        {
            if existing.contestant_id != candidate || existing.package_id != package {
                return Err(AppError::Conflict(
                    "Idempotency-Key was already used for a different vote purchase".into(),
                ));
            }
            let minor = (existing.amount * Decimal::from(100))
                .round()
                .to_i64()
                .ok_or(AppError::Internal)?;
            let label = format!("{} votes", existing.quantity);
            tx.commit().await.map_err(db)?;
            return Ok((vote(existing), minor, label));
        }
        let contestant = sqlx::query_scalar::<_, bool>(
            "SELECT EXISTS(SELECT 1 FROM contestants WHERE id=$1 AND pageant_id=$2 AND is_active)",
        )
        .bind(candidate)
        .bind(pageant)
        .fetch_one(&mut *tx)
        .await
        .map_err(db)?;
        if !contestant {
            return Err(AppError::NotFound("active contestant".into()));
        }
        let package_row=sqlx::query_as::<_,PackageRow>("SELECT id,pageant_id,name,description,vote_quantity,price_amount,currency::text AS currency FROM pageant_vote_packages WHERE id=$1 AND pageant_id=$2 AND is_active FOR SHARE").bind(package).bind(pageant).fetch_optional(&mut *tx).await.map_err(db)?.ok_or_else(||AppError::NotFound("active pageant vote package".into()))?;
        if package_row.currency.trim() != "PHP" {
            return Err(AppError::BadRequest(
                "PayMongo checkout currently requires PHP vote packages".into(),
            ));
        }
        if let Some(limit) = config.1 {
            let used=sqlx::query_scalar::<_,i64>("SELECT COALESCE(SUM(quantity),0)::bigint FROM audience_vote_transactions WHERE voting_configuration_id=$1 AND audience_voter_id=$2 AND (status='VALID' OR (status='PENDING' AND created_at>now()-interval '30 minutes'))").bind(config.0).bind(voter).fetch_one(&mut *tx).await.map_err(db)?;
            if used + package_row.vote_quantity as i64 > limit as i64 {
                return Err(AppError::Conflict(
                    "this vote package exceeds your remaining voting limit".into(),
                ));
            }
        }
        if let Some(limit) = config.2 {
            let used=sqlx::query_scalar::<_,i64>("SELECT COALESCE(SUM(quantity),0)::bigint FROM audience_vote_transactions WHERE voting_configuration_id=$1 AND contestant_id=$2 AND (status='VALID' OR (status='PENDING' AND created_at>now()-interval '30 minutes'))").bind(config.0).bind(candidate).fetch_one(&mut *tx).await.map_err(db)?;
            if used + package_row.vote_quantity as i64 > limit as i64 {
                return Err(AppError::Conflict(
                    "this vote package exceeds the contestant voting limit".into(),
                ));
            }
        }
        let id = Uuid::new_v4();
        let free = package_row.price_amount == Decimal::ZERO;
        let status = if free { "VALID" } else { "PENDING" };
        let row=sqlx::query_as::<_,VoteRow>(&format!("INSERT INTO audience_vote_transactions(id,voting_configuration_id,contestant_id,audience_voter_id,package_id,quantity,status,idempotency_key,amount,currency,verified_at) VALUES($1,$2,$3,$4,$5,$6,$7::audience_vote_status,$8,$9,$10,CASE WHEN $7::audience_vote_status='VALID'::audience_vote_status THEN now() END) RETURNING id,contestant_id,package_id,quantity,amount,currency,status::text AS status,NULL::text AS checkout_url"))
   .bind(id).bind(config.0).bind(candidate).bind(voter).bind(package).bind(package_row.vote_quantity).bind(status).bind(key).bind(package_row.price_amount).bind(package_row.currency.trim()).fetch_one(&mut *tx).await.map_err(db)?;
        sqlx::query("INSERT INTO transaction_logs(transaction_type,organization_id,pageant_id,actor_user_id,reference_type,reference_id,status,amount,currency,metadata,completed_at) SELECT 'VOTE'::business_transaction_type,p.organization_id,$1,$2,'AUDIENCE_VOTE',$3,CASE WHEN $4 THEN 'COMPLETED'::business_transaction_status ELSE 'PENDING'::business_transaction_status END,$5,$6,jsonb_build_object('package_id',$7,'vote_quantity',$8),CASE WHEN $4 THEN now() END FROM pageants p WHERE p.id=$1")
            .bind(pageant).bind(user).bind(id).bind(free).bind(package_row.price_amount).bind(package_row.currency.trim()).bind(package).bind(package_row.vote_quantity).execute(&mut *tx).await.map_err(db)?;
        if free {
            sqlx::query("INSERT INTO audience_vote_totals(voting_configuration_id,contestant_id,total_votes) VALUES($1,$2,$3) ON CONFLICT(voting_configuration_id,contestant_id) DO UPDATE SET total_votes=audience_vote_totals.total_votes+EXCLUDED.total_votes,updated_at=now()").bind(config.0).bind(candidate).bind(package_row.vote_quantity as i64).execute(&mut *tx).await.map_err(db)?;
        }
        tx.commit().await.map_err(db)?;
        let minor = (package_row.price_amount * Decimal::from(100))
            .round()
            .to_i64()
            .ok_or(AppError::Internal)?;
        Ok((vote(row), minor, package_row.name))
    }
    async fn attach_checkout(
        &self,
        vote_id: Uuid,
        session: &str,
        url: &str,
    ) -> Result<(), AppError> {
        let result=sqlx::query("UPDATE audience_vote_transactions SET checkout_session_id=$2,checkout_url=$3 WHERE id=$1 AND status='PENDING' AND (checkout_session_id IS NULL OR checkout_session_id=$2)").bind(vote_id).bind(session).bind(url).execute(&self.pool).await.map_err(db)?;
        if result.rows_affected() == 0 {
            return Err(AppError::Conflict(
                "vote checkout is no longer pending".into(),
            ));
        }
        Ok(())
    }
    async fn status(&self, user: Uuid, id: Uuid) -> Result<VoteCheckout, AppError> {
        let sql = format!(
            "{AUDIENCE_VOTE_SELECT} WHERE id=$1 AND audience_voter_id=(SELECT id FROM audience_voters WHERE user_id=$2)"
        );
        sqlx::query_as::<_, VoteRow>(&sql)
            .bind(id)
            .bind(user)
            .fetch_optional(&self.pool)
            .await
            .map_err(db)?
            .map(vote)
            .ok_or_else(|| AppError::NotFound("vote purchase".into()))
    }
    async fn confirm_checkout(
        &self,
        session: &str,
        payment_id: Option<&str>,
    ) -> Result<bool, AppError> {
        let mut tx = self.pool.begin().await.map_err(db)?;
        let row=sqlx::query_as::<_,(Uuid,Uuid,i32,Uuid,Uuid)>("SELECT voting_configuration_id,contestant_id,quantity,id,audience_voter_id FROM audience_vote_transactions WHERE checkout_session_id=$1 AND status='PENDING' FOR UPDATE").bind(session).fetch_optional(&mut *tx).await.map_err(db)?;
        let Some((config, candidate, quantity, vote_id, voter_id)) = row else {
            tx.commit().await.map_err(db)?;
            return Ok(false);
        };
        let limits=sqlx::query_as::<_,(Option<i32>,Option<i32>)>("SELECT vote_limit_per_voter,vote_limit_per_contestant FROM voting_configurations WHERE id=$1 FOR UPDATE").bind(config).fetch_one(&mut *tx).await.map_err(db)?;
        let voter_total=sqlx::query_scalar::<_,i64>("SELECT COALESCE(SUM(quantity),0)::bigint FROM audience_vote_transactions WHERE voting_configuration_id=$1 AND audience_voter_id=$2 AND id<>$3 AND status='VALID'").bind(config).bind(voter_id).bind(vote_id).fetch_one(&mut *tx).await.map_err(db)?;
        let candidate_total=sqlx::query_scalar::<_,i64>("SELECT COALESCE(SUM(quantity),0)::bigint FROM audience_vote_transactions WHERE voting_configuration_id=$1 AND contestant_id=$2 AND id<>$3 AND status='VALID'").bind(config).bind(candidate).bind(vote_id).fetch_one(&mut *tx).await.map_err(db)?;
        let over_limit = limits
            .0
            .is_some_and(|limit| voter_total + quantity as i64 > limit as i64)
            || limits
                .1
                .is_some_and(|limit| candidate_total + quantity as i64 > limit as i64);
        if over_limit {
            sqlx::query("UPDATE audience_vote_transactions SET status='REVIEW',invalid_reason='paid after voting limit was reached; refund review required',provider_payment_id=$2,paid_at=now() WHERE id=$1 AND status='PENDING'").bind(vote_id).bind(payment_id).execute(&mut *tx).await.map_err(db)?;
            sqlx::query("UPDATE transaction_logs SET status='REVERSED',metadata=metadata||jsonb_build_object('paid_vote_review_required',true,'provider','PAYMONGO','paymongo_payment_id',$2),completed_at=now() WHERE reference_type='AUDIENCE_VOTE' AND reference_id=$1 AND status='PENDING'").bind(vote_id).bind(payment_id).execute(&mut *tx).await.map_err(db)?;
            tx.commit().await.map_err(db)?;
            return Ok(true);
        }
        sqlx::query("UPDATE audience_vote_transactions SET status='VALID',paid_at=now(),verified_at=now(),provider_payment_id=$2 WHERE id=$1 AND status='PENDING'").bind(vote_id).bind(payment_id).execute(&mut *tx).await.map_err(db)?;
        sqlx::query("UPDATE transaction_logs SET status='COMPLETED',metadata=metadata||jsonb_build_object('provider','PAYMONGO','paymongo_payment_id',$2),completed_at=now() WHERE reference_type='AUDIENCE_VOTE' AND reference_id=$1 AND status='PENDING'").bind(vote_id).bind(payment_id).execute(&mut *tx).await.map_err(db)?;
        sqlx::query("INSERT INTO audience_vote_totals(voting_configuration_id,contestant_id,total_votes) VALUES($1,$2,$3) ON CONFLICT(voting_configuration_id,contestant_id) DO UPDATE SET total_votes=audience_vote_totals.total_votes+EXCLUDED.total_votes,updated_at=now()").bind(config).bind(candidate).bind(quantity as i64).execute(&mut *tx).await.map_err(db)?;
        tx.commit().await.map_err(db)?;
        Ok(true)
    }
}
