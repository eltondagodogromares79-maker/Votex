use async_trait::async_trait;
use chrono::{DateTime, Utc};
use sqlx::{PgPool, Row};
use uuid::Uuid;

use core_infra::AppError;

use crate::{
    application::ports::refresh_token_workflow::{RefreshSessionResult, RefreshTokenWorkflow},
    domain::models::{
        auth_session::AuthSession,
        user::{User, UserAccountStatus},
    },
    utils::refresh_token::{generate_refresh_token, hash_refresh_token},
};

pub struct PostgresRefreshTokenWorkflow {
    pool: PgPool,
    refresh_token_ttl_days: i64,
}

impl PostgresRefreshTokenWorkflow {
    pub fn new(pool: PgPool, refresh_token_ttl_days: i64) -> Self {
        Self {
            pool,
            refresh_token_ttl_days,
        }
    }
}

#[async_trait]
impl RefreshTokenWorkflow for PostgresRefreshTokenWorkflow {
    async fn refresh_session(&self, refresh_token: &str) -> Result<RefreshSessionResult, AppError> {
        let token_hash = hash_refresh_token(refresh_token);

        let mut transaction = self
            .pool
            .begin()
            .await
            .map_err(|error| AppError::Database(Box::new(error)))?;

        // Lock the existing refresh-token row so two concurrent
        // refresh requests cannot rotate the same token successfully.
        let old_session = sqlx::query(
            r#"
            SELECT
                id,
                user_id,
                expires_at,
                revoked_at,
                user_agent,
                ip_address::text AS ip_address,
                replaced_by_token_id
            FROM user_refresh_tokens
            WHERE token_hash = $1
            FOR UPDATE
            "#,
        )
        .bind(&token_hash)
        .fetch_optional(&mut *transaction)
        .await
        .map_err(|error| AppError::Database(Box::new(error)))?;

        let old_session = match old_session {
            Some(session) => session,
            None => return Err(AppError::InvalidToken),
        };

        let session_id: Uuid = old_session
            .try_get("id")
            .map_err(|error| AppError::Database(Box::new(error)))?;

        let user_id: Uuid = old_session
            .try_get("user_id")
            .map_err(|error| AppError::Database(Box::new(error)))?;

        let expires_at: DateTime<Utc> = old_session
            .try_get("expires_at")
            .map_err(|error| AppError::Database(Box::new(error)))?;

        let revoked_at: Option<DateTime<Utc>> = old_session
            .try_get("revoked_at")
            .map_err(|error| AppError::Database(Box::new(error)))?;

        let user_agent: Option<String> = old_session
            .try_get("user_agent")
            .map_err(|error| AppError::Database(Box::new(error)))?;

        let ip_address: Option<String> = old_session
            .try_get("ip_address")
            .map_err(|error| AppError::Database(Box::new(error)))?;

        let replaced_by_token_id: Option<Uuid> = old_session
            .try_get("replaced_by_token_id")
            .map_err(|error| AppError::Database(Box::new(error)))?;

        // A refresh token can only be used once.
        if revoked_at.is_some() || expires_at <= Utc::now() || replaced_by_token_id.is_some() {
            return Err(AppError::InvalidToken);
        }

        // Load the user inside the same transaction.
        let user_row = sqlx::query(
            r#"
            SELECT
                id,
                email::text AS email,
                password_hash,
                first_name,
                middle_name,
                last_name,
                phone,
                profile_image_url,
                status::text AS status,
                email_verified_at,
                last_login_at,
                failed_login_attempts,
                locked_until,
                created_at,
                updated_at,
                failed_login_window_started_at
            FROM users
            WHERE id = $1
            "#,
        )
        .bind(user_id)
        .fetch_optional(&mut *transaction)
        .await
        .map_err(|error| AppError::Database(Box::new(error)))?;

        let user_row = match user_row {
            Some(user) => user,
            None => return Err(AppError::InvalidToken),
        };

        let user = User {
            id: user_row
                .try_get("id")
                .map_err(|error| AppError::Database(Box::new(error)))?,

            email: user_row
                .try_get("email")
                .map_err(|error| AppError::Database(Box::new(error)))?,

            password_hash: user_row
                .try_get("password_hash")
                .map_err(|error| AppError::Database(Box::new(error)))?,

            first_name: user_row
                .try_get("first_name")
                .map_err(|error| AppError::Database(Box::new(error)))?,

            middle_name: user_row
                .try_get("middle_name")
                .map_err(|error| AppError::Database(Box::new(error)))?,

            last_name: user_row
                .try_get("last_name")
                .map_err(|error| AppError::Database(Box::new(error)))?,

            phone: user_row
                .try_get("phone")
                .map_err(|error| AppError::Database(Box::new(error)))?,

            profile_image_url: user_row
                .try_get("profile_image_url")
                .map_err(|error| AppError::Database(Box::new(error)))?,

            status: UserAccountStatus::from_str(
                &user_row
                    .try_get::<String, _>("status")
                    .map_err(|error| AppError::Database(Box::new(error)))?,
            ),

            email_verified_at: user_row
                .try_get("email_verified_at")
                .map_err(|error| AppError::Database(Box::new(error)))?,

            last_login_at: user_row
                .try_get("last_login_at")
                .map_err(|error| AppError::Database(Box::new(error)))?,

            failed_login_attempts: user_row
                .try_get("failed_login_attempts")
                .map_err(|error| AppError::Database(Box::new(error)))?,

            failed_login_window_started_at: user_row
                .try_get("failed_login_window_started_at")
                .map_err(|error| AppError::Database(Box::new(error)))?,

            locked_until: user_row
                .try_get("locked_until")
                .map_err(|error| AppError::Database(Box::new(error)))?,

            created_at: user_row
                .try_get("created_at")
                .map_err(|error| AppError::Database(Box::new(error)))?,

            updated_at: user_row
                .try_get("updated_at")
                .map_err(|error| AppError::Database(Box::new(error)))?,
        };

        let new_refresh_token = generate_refresh_token();
        let new_token_hash = hash_refresh_token(&new_refresh_token);

        let new_expires_at = Utc::now() + chrono::Duration::days(self.refresh_token_ttl_days);

        let new_row = sqlx::query(
            r#"
            INSERT INTO user_refresh_tokens (
                user_id,
                token_hash,
                expires_at,
                user_agent,
                ip_address
            )
            VALUES ($1, $2, $3, $4, $5::inet)
            RETURNING
                id,
                issued_at,
                expires_at,
                revoked_at,
                user_agent,
                ip_address::text AS ip_address
            "#,
        )
        .bind(user_id)
        .bind(&new_token_hash)
        .bind(new_expires_at)
        .bind(&user_agent)
        .bind(&ip_address)
        .fetch_one(&mut *transaction)
        .await
        .map_err(|error| AppError::Database(Box::new(error)))?;

        let new_session_id: Uuid = new_row
            .try_get("id")
            .map_err(|error| AppError::Database(Box::new(error)))?;

        // Revoke the old refresh token and point it to the replacement.
        sqlx::query(
            r#"
            UPDATE user_refresh_tokens
            SET
                revoked_at = now(),
                replaced_by_token_id = $2
            WHERE id = $1
            "#,
        )
        .bind(session_id)
        .bind(new_session_id)
        .execute(&mut *transaction)
        .await
        .map_err(|error| AppError::Database(Box::new(error)))?;

        transaction
            .commit()
            .await
            .map_err(|error| AppError::Database(Box::new(error)))?;

        let new_ip_address: Option<String> = new_row
            .try_get("ip_address")
            .map_err(|error| AppError::Database(Box::new(error)))?;

        let new_ip_address = new_ip_address
            .map(|ip| {
                ip.parse::<std::net::IpAddr>()
                    .map_err(|error| AppError::Database(Box::new(error)))
            })
            .transpose()?;

        let new_issued_at: DateTime<Utc> = new_row
            .try_get("issued_at")
            .map_err(|error| AppError::Database(Box::new(error)))?;

        let new_expires_at: DateTime<Utc> = new_row
            .try_get("expires_at")
            .map_err(|error| AppError::Database(Box::new(error)))?;

        let new_revoked_at: Option<DateTime<Utc>> = new_row
            .try_get("revoked_at")
            .map_err(|error| AppError::Database(Box::new(error)))?;

        let new_user_agent: Option<String> = new_row
            .try_get("user_agent")
            .map_err(|error| AppError::Database(Box::new(error)))?;

        let session = AuthSession {
            id: new_session_id,
            user_id,
            issued_at: new_issued_at,
            expires_at: new_expires_at,
            revoked_at: new_revoked_at,
            user_agent: new_user_agent,
            ip_address: new_ip_address,
        };

        Ok(RefreshSessionResult {
            user,
            session,
            refresh_token: new_refresh_token,
        })
    }
}
