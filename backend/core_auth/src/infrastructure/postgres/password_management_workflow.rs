use crate::{
    application::ports::password_management_workflow::PasswordManagementWorkflow,
    utils::password::verify_password,
};
use async_trait::async_trait;
use core_infra::AppError;
use sqlx::PgPool;
use uuid::Uuid;

pub struct PostgresPasswordManagementWorkflow {
    pool: PgPool,
}
impl PostgresPasswordManagementWorkflow {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}
#[async_trait]
impl PasswordManagementWorkflow for PostgresPasswordManagementWorkflow {
    async fn change_password(
        &self,
        user_id: Uuid,
        current_password: &str,
        new_password_hash: &str,
    ) -> Result<(), AppError> {
        let mut tx = self.pool.begin().await.map_err(db)?;
        let current_hash=sqlx::query_scalar::<_,Option<String>>("SELECT password_hash FROM users WHERE id=$1 AND status='ACTIVE'::user_account_status FOR UPDATE")
            .bind(user_id).fetch_optional(&mut *tx).await.map_err(db)?
            .flatten().ok_or(AppError::InvalidCredentials)?;
        if !verify_password(current_password, &current_hash)? {
            return Err(AppError::InvalidCredentials);
        }
        sqlx::query("UPDATE users SET password_hash=$2, must_change_password=FALSE, updated_at=now() WHERE id=$1")
            .bind(user_id)
            .bind(new_password_hash)
            .execute(&mut *tx)
            .await
            .map_err(db)?;
        sqlx::query("UPDATE user_refresh_tokens SET revoked_at=now() WHERE user_id=$1 AND revoked_at IS NULL")
            .bind(user_id).execute(&mut *tx).await.map_err(db)?;
        tx.commit().await.map_err(db)
    }
}
fn db(error: sqlx::Error) -> AppError {
    AppError::Database(Box::new(error))
}
