use crate::{
    application::ports::password_management_workflow::PasswordManagementWorkflow,
    utils::{password::hash_password, password_validation::validate_password},
};
use core_infra::AppError;
use std::sync::Arc;
use uuid::Uuid;

pub struct PasswordManagementApplication {
    workflow: Arc<dyn PasswordManagementWorkflow>,
}
impl PasswordManagementApplication {
    pub fn new(workflow: Arc<dyn PasswordManagementWorkflow>) -> Self {
        Self { workflow }
    }
    pub async fn change_password(
        &self,
        user_id: Uuid,
        current: &str,
        new: &str,
    ) -> Result<(), AppError> {
        if current == new {
            return Err(AppError::BadRequest(
                "new password must be different from current password".to_owned(),
            ));
        }
        validate_password(new).map_err(|error| {
            AppError::BadRequest(
                error
                    .message
                    .map(|message| message.to_string())
                    .unwrap_or_else(|| "invalid password".to_owned()),
            )
        })?;
        let hash = hash_password(new)?;
        self.workflow.change_password(user_id, current, &hash).await
    }
}
