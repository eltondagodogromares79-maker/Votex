use async_trait::async_trait;
use sqlx::PgPool;

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
                WHERE u.email = $1
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
