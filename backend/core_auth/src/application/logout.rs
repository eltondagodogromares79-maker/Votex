use std::sync::Arc;

use core_infra::AppError;

use crate::application::ports::logout_workflow::LogoutWorkflow;

pub struct LogoutApplication {
    logout_workflow: Arc<dyn LogoutWorkflow>,
}

impl LogoutApplication {
    pub fn new(logout_workflow: Arc<dyn LogoutWorkflow>) -> Self {
        Self { logout_workflow }
    }

    pub async fn logout(&self, refresh_token: &str) -> Result<(), AppError> {
        self.logout_workflow.logout(refresh_token).await
    }
}
