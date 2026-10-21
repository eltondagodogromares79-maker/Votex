use async_trait::async_trait;
use core_infra::AppError;
use uuid::Uuid;

use crate::contracts::notifications::NotificationPage;

#[async_trait]
pub trait NotificationWorkflow: Send + Sync {
    async fn list(
        &self,
        user_id: Uuid,
        limit: i64,
        offset: i64,
    ) -> Result<NotificationPage, AppError>;
    async fn mark_read(&self, user_id: Uuid, notification_id: Uuid) -> Result<bool, AppError>;
    async fn mark_all_read(&self, user_id: Uuid) -> Result<(), AppError>;
}
