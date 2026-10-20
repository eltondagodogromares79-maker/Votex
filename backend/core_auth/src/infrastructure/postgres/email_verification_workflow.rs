use async_trait::async_trait;
use chrono::{DateTime, Utc};
use sqlx::PgPool;
use uuid::Uuid;

use core_infra::AppError;

use crate::application::ports::email_verification_workflow::EmailVerificationWorkflow;

pub struct PostgresEmailVerificationWorkflow {
    pool: PgPool,
}

impl PostgresEmailVerificationWorkflow {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

fn map_database_error(error: sqlx::Error) -> AppError {
    AppError::Database(Box::new(error))
}

#[async_trait]
impl EmailVerificationWorkflow for PostgresEmailVerificationWorkflow {
    async fn create_verification_token(
        &self,
        user_id: Uuid,
        token_hash: &str,
        expires_at: DateTime<Utc>,
    ) -> Result<Option<(String, String)>, AppError> {
        let mut transaction = self.pool.begin().await.map_err(map_database_error)?;
        let user: Option<(String, String)> = sqlx::query_as(
            "SELECT COALESCE(pending_email, email)::text, first_name FROM users WHERE id = $1 AND status = 'ACTIVE'::user_account_status AND (email_verified_at IS NULL OR pending_email IS NOT NULL) FOR UPDATE",
        )
        .bind(user_id)
        .fetch_optional(&mut *transaction)
        .await
        .map_err(map_database_error)?;

        let Some((email, first_name)) = user else {
            transaction.commit().await.map_err(map_database_error)?;
            return Ok(None);
        };

        sqlx::query("UPDATE user_email_verification_tokens SET expires_at = now() WHERE user_id = $1 AND verified_at IS NULL")
            .bind(user_id)
            .execute(&mut *transaction)
            .await
            .map_err(map_database_error)?;
        sqlx::query("INSERT INTO user_email_verification_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)")
            .bind(user_id)
            .bind(token_hash)
            .bind(expires_at)
            .execute(&mut *transaction)
            .await
            .map_err(map_database_error)?;
        transaction.commit().await.map_err(map_database_error)?;
        Ok(Some((email, first_name)))
    }

    async fn verify_email(&self, email: &str, token_hash: &str) -> Result<(), AppError> {
        let mut transaction = self.pool.begin().await.map_err(map_database_error)?;

        // --------------------------------------------------
        // Find valid verification token
        // --------------------------------------------------

        let verification_record: Option<(uuid::Uuid, uuid::Uuid)> = sqlx::query_as(
            r#"
                SELECT
                    u.id,
                    evt.id
                FROM users u
                INNER JOIN user_email_verification_tokens evt
                    ON evt.user_id = u.id
                WHERE (u.email = $1 OR u.pending_email = $1)
                  AND evt.token_hash = $2
                  AND evt.verified_at IS NULL
                  AND evt.expires_at > now()
                "#,
        )
        .bind(email)
        .bind(token_hash)
        .fetch_optional(&mut *transaction)
        .await
        .map_err(map_database_error)?;

        let (user_id, token_id) = verification_record.ok_or(AppError::InvalidToken)?;

        // The verification token is a public credential, so establish the
        // verified token owner's identity only after validating it. The GUC is
        // transaction-local and permits the audience_voters RLS update below
        // without granting anonymous callers broader access.
        sqlx::query(
            "SELECT set_config('votex.user_id', $1, true), set_config('votex.user_role', 'VERIFIED_USER', true), set_config('votex.is_system', 'false', true)",
        )
        .bind(user_id.to_string())
        .execute(&mut *transaction)
        .await
        .map_err(map_database_error)?;

        // --------------------------------------------------
        // Mark verification token as verified
        // --------------------------------------------------

        sqlx::query(
            r#"
            UPDATE user_email_verification_tokens
            SET verified_at = now()
            WHERE id = $1
            "#,
        )
        .bind(token_id)
        .execute(&mut *transaction)
        .await
        .map_err(map_database_error)?;

        // --------------------------------------------------
        // Mark user's email as verified
        // --------------------------------------------------

        sqlx::query(
            r#"
            UPDATE users
            SET
                email = COALESCE(pending_email, email),
                pending_email = NULL,
                email_verified_at = now(),
                updated_at = now()
            WHERE id = $1
            "#,
        )
        .bind(user_id)
        .execute(&mut *transaction)
        .await
        .map_err(map_database_error)?;

        // --------------------------------------------------
        // Mark audience voter as verified
        // --------------------------------------------------

        sqlx::query(
            r#"
            UPDATE audience_voters
            SET verification_status = 'VERIFIED'
            WHERE user_id = $1
            "#,
        )
        .bind(user_id)
        .execute(&mut *transaction)
        .await
        .map_err(map_database_error)?;

        // --------------------------------------------------
        // Commit
        // --------------------------------------------------

        transaction.commit().await.map_err(map_database_error)?;

        Ok(())
    }
}
