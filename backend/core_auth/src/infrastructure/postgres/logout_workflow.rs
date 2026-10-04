use async_trait::async_trait;
use sqlx::PgPool;

use core_infra::AppError;

use crate::{
    application::ports::logout_workflow::LogoutWorkflow, utils::refresh_token::hash_refresh_token,
};

pub struct PostgresLogoutWorkflow {
    pool: PgPool,
}

impl PostgresLogoutWorkflow {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl LogoutWorkflow for PostgresLogoutWorkflow {
    async fn logout(&self, refresh_token: &str) -> Result<(), AppError> {
        let token_hash = hash_refresh_token(refresh_token);

        sqlx::query(
            r#"
            UPDATE user_refresh_tokens
            SET revoked_at = COALESCE(revoked_at, now())
            WHERE token_hash = $1
            "#,
        )
        .bind(&token_hash)
        .execute(&self.pool)
        .await
        .map_err(|error| AppError::Database(Box::new(error)))?;

        Ok(())
    }
}
