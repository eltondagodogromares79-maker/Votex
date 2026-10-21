use crate::{
    application::ports::contact_message_workflow::ContactMessageWorkflow,
    domain::contact_messages::{ContactMessagePage, SubmittedContactMessage},
};
use core_infra::AppError;
use std::sync::Arc;
use uuid::Uuid;

pub struct ContactMessageApplication {
    workflow: Arc<dyn ContactMessageWorkflow>,
}
impl ContactMessageApplication {
    pub fn new(workflow: Arc<dyn ContactMessageWorkflow>) -> Self {
        Self { workflow }
    }
    pub async fn submit(
        &self,
        user_id: Uuid,
        subject: &str,
        message: &str,
    ) -> Result<SubmittedContactMessage, AppError> {
        let subject = subject.trim();
        let message = message.trim();
        if !(5..=200).contains(&subject.chars().count()) {
            return Err(AppError::BadRequest(
                "Subject must be between 5 and 200 characters.".into(),
            ));
        }
        if !(20..=2000).contains(&message.chars().count()) {
            return Err(AppError::BadRequest(
                "Message must be between 20 and 2,000 characters.".into(),
            ));
        }
        self.workflow
            .submit(user_id, subject, message)
            .await?
            .ok_or(AppError::Unauthorized)
    }
    pub async fn list(
        &self,
        limit: Option<i64>,
        offset: Option<i64>,
    ) -> Result<ContactMessagePage, AppError> {
        self.workflow
            .list(
                limit.unwrap_or(30).clamp(1, 100),
                offset.unwrap_or(0).max(0),
            )
            .await
    }
}
