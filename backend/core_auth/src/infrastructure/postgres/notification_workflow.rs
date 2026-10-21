use async_trait::async_trait;
use core_infra::AppError;
use sqlx::{FromRow, PgPool};
use uuid::Uuid;

use crate::{
    application::ports::notification_workflow::NotificationWorkflow,
    contracts::notifications::{Notification, NotificationPage},
};

pub struct PostgresNotificationWorkflow {
    pool: PgPool,
}

impl PostgresNotificationWorkflow {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[derive(FromRow)]
struct NotificationRow {
    id: Uuid,
    notification_type: String,
    title: String,
    message: String,
    href: Option<String>,
    read_at: Option<chrono::DateTime<chrono::Utc>>,
    created_at: chrono::DateTime<chrono::Utc>,
}

impl From<NotificationRow> for Notification {
    fn from(row: NotificationRow) -> Self {
        Self {
            id: row.id,
            notification_type: row.notification_type,
            title: row.title,
            message: row.message,
            href: row.href,
            read_at: row.read_at,
            created_at: row.created_at,
        }
    }
}

fn db(error: sqlx::Error) -> AppError {
    AppError::Database(Box::new(error))
}

#[async_trait]
impl NotificationWorkflow for PostgresNotificationWorkflow {
    async fn list(
        &self,
        user_id: Uuid,
        limit: i64,
        offset: i64,
    ) -> Result<NotificationPage, AppError> {
        let rows = sqlx::query_as::<_, NotificationRow>(
            "SELECT id, notification_type, title, message, href, read_at, created_at \
             FROM user_notifications WHERE recipient_user_id = $1 \
             ORDER BY created_at DESC, id DESC LIMIT $2 OFFSET $3",
        )
        .bind(user_id)
        .bind(limit)
        .bind(offset)
        .fetch_all(&self.pool)
        .await
        .map_err(db)?;
        let unread_count = sqlx::query_scalar::<_, i64>(
            "SELECT COUNT(*)::bigint FROM user_notifications WHERE recipient_user_id = $1 AND read_at IS NULL",
        )
        .bind(user_id)
        .fetch_one(&self.pool)
        .await
        .map_err(db)?;
        let total = sqlx::query_scalar::<_, i64>(
            "SELECT COUNT(*)::bigint FROM user_notifications WHERE recipient_user_id = $1",
        )
        .bind(user_id)
        .fetch_one(&self.pool)
        .await
        .map_err(db)?;

        Ok(NotificationPage {
            items: rows.into_iter().map(Into::into).collect(),
            unread_count,
            total,
            limit,
            offset,
        })
    }

    async fn mark_read(&self, user_id: Uuid, notification_id: Uuid) -> Result<bool, AppError> {
        let result = sqlx::query(
            "UPDATE user_notifications SET read_at = COALESCE(read_at, now()) \
             WHERE id = $1 AND recipient_user_id = $2",
        )
        .bind(notification_id)
        .bind(user_id)
        .execute(&self.pool)
        .await
        .map_err(db)?;
        Ok(result.rows_affected() > 0)
    }

    async fn mark_all_read(&self, user_id: Uuid) -> Result<(), AppError> {
        sqlx::query(
            "UPDATE user_notifications SET read_at = now() \
             WHERE recipient_user_id = $1 AND read_at IS NULL",
        )
        .bind(user_id)
        .execute(&self.pool)
        .await
        .map_err(db)?;
        Ok(())
    }
}
