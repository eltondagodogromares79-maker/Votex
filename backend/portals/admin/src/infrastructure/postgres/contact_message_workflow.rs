use crate::{
    application::ports::contact_message_workflow::ContactMessageWorkflow,
    domain::contact_messages::{ContactMessage, ContactMessagePage, SubmittedContactMessage},
};
use async_trait::async_trait;
use core_infra::AppError;
use sqlx::PgPool;
use uuid::Uuid;

pub struct PostgresContactMessageWorkflow {
    pool: PgPool,
}
impl PostgresContactMessageWorkflow {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}
fn db(error: sqlx::Error) -> AppError {
    AppError::Database(Box::new(error))
}

#[async_trait]
impl ContactMessageWorkflow for PostgresContactMessageWorkflow {
    async fn submit(
        &self,
        user_id: Uuid,
        subject: &str,
        message: &str,
    ) -> Result<Option<SubmittedContactMessage>, AppError> {
        sqlx::query_as::<_, SubmittedContactMessage>("INSERT INTO contact_messages (sender_user_id, sender_name, sender_email, subject, message) SELECT id, concat_ws(' ', first_name, last_name), email, $2, $3 FROM users WHERE id = $1 RETURNING id, status, created_at")
            .bind(user_id).bind(subject).bind(message).fetch_optional(&self.pool).await.map_err(db)
    }
    async fn list(&self, limit: i64, offset: i64) -> Result<ContactMessagePage, AppError> {
        let items = sqlx::query_as::<_, ContactMessage>("SELECT id, sender_user_id, sender_name, sender_email, subject, message, status, created_at FROM contact_messages ORDER BY created_at DESC, id DESC LIMIT $1 OFFSET $2")
            .bind(limit).bind(offset).fetch_all(&self.pool).await.map_err(db)?;
        Ok(ContactMessagePage {
            items,
            limit,
            offset,
        })
    }
}
