use std::sync::Arc;

use core_infra::AppError;
use uuid::Uuid;

use crate::{
    application::ports::notification_workflow::NotificationWorkflow,
    contracts::notifications::NotificationPage,
};

pub struct NotificationApplication {
    workflow: Arc<dyn NotificationWorkflow>,
}

impl NotificationApplication {
    pub fn new(workflow: Arc<dyn NotificationWorkflow>) -> Self {
        Self { workflow }
    }

    pub async fn list(
        &self,
        user_id: Uuid,
        limit: Option<i64>,
        offset: Option<i64>,
    ) -> Result<NotificationPage, AppError> {
        self.workflow
            .list(
                user_id,
                limit.unwrap_or(30).clamp(1, 100),
                offset.unwrap_or(0).max(0),
            )
            .await
    }

    pub async fn mark_read(&self, user_id: Uuid, notification_id: Uuid) -> Result<(), AppError> {
        if self.workflow.mark_read(user_id, notification_id).await? {
            Ok(())
        } else {
            Err(AppError::NotFound("notification".into()))
        }
    }

    pub async fn mark_all_read(&self, user_id: Uuid) -> Result<(), AppError> {
        self.workflow.mark_all_read(user_id).await
    }
}
