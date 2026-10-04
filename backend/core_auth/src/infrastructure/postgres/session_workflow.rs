use std::net::IpAddr;

use async_trait::async_trait;
use chrono::{Duration, Utc};
use sqlx::{PgPool, Row};
use uuid::Uuid;

use core_infra::AppError;

use crate::{
    application::ports::session_workflow::{CreateSessionResult, SessionWorkflow},
    domain::models::auth_session::AuthSession,
    utils::refresh_token::{generate_refresh_token, hash_refresh_token},
};

pub struct PostgresSessionWorkflow {
    pool: PgPool,
    refresh_token_ttl_days: i64,
}

impl PostgresSessionWorkflow {
    pub fn new(pool: PgPool, refresh_token_ttl_days: i64) -> Self {
        Self {
            pool,
            refresh_token_ttl_days,
        }
    }
}

#[async_trait]
impl SessionWorkflow for PostgresSessionWorkflow {
    async fn create_session(
        &self,
        user_id: Uuid,
        user_agent: Option<String>,
        ip_address: Option<IpAddr>,
    ) -> Result<CreateSessionResult, AppError> {
        let refresh_token = generate_refresh_token();
        let token_hash = hash_refresh_token(&refresh_token);
        let expires_at = Utc::now() + Duration::days(self.refresh_token_ttl_days);

        let ip_address = ip_address.map(|ip| ip.to_string());

        let row = sqlx::query(
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
                user_id,
                issued_at,
                expires_at,
                revoked_at,
                user_agent,
                ip_address::text AS ip_address
            "#,
        )
        .bind(user_id)
        .bind(token_hash)
        .bind(expires_at)
        .bind(user_agent)
        .bind(ip_address)
        .fetch_one(&self.pool)
        .await
        .map_err(|error| AppError::Database(Box::new(error)))?;

        let ip_address: Option<String> = row
            .try_get("ip_address")
            .map_err(|error| AppError::Database(Box::new(error)))?;

        let ip_address = ip_address
            .map(|ip| {
                ip.parse::<IpAddr>()
                    .map_err(|error| AppError::Database(Box::new(error)))
            })
            .transpose()?;

        let session = AuthSession {
            id: row
                .try_get("id")
                .map_err(|error| AppError::Database(Box::new(error)))?,
            user_id: row
                .try_get("user_id")
                .map_err(|error| AppError::Database(Box::new(error)))?,
            issued_at: row
                .try_get("issued_at")
                .map_err(|error| AppError::Database(Box::new(error)))?,
            expires_at: row
                .try_get("expires_at")
                .map_err(|error| AppError::Database(Box::new(error)))?,
            revoked_at: row
                .try_get("revoked_at")
                .map_err(|error| AppError::Database(Box::new(error)))?,
            user_agent: row
                .try_get("user_agent")
                .map_err(|error| AppError::Database(Box::new(error)))?,
            ip_address,
        };

        Ok(CreateSessionResult {
            session,
            refresh_token,
        })
    }

    async fn revoke_session(&self, session_id: Uuid) -> Result<(), AppError> {
        sqlx::query(
            r#"
            UPDATE user_refresh_tokens
            SET revoked_at = COALESCE(revoked_at, now())
            WHERE id = $1
            "#,
        )
        .bind(session_id)
        .execute(&self.pool)
        .await
        .map_err(|error| AppError::Database(Box::new(error)))?;

        Ok(())
    }
}
