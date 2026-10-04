use std::sync::Arc;

use core_infra::AppError;

use crate::{
    application::ports::email_verification_workflow::EmailVerificationWorkflow,
    contracts::registration::VerifyEmailRequest, utils::verification::hash_verification_code,
};

pub struct EmailVerificationApplication {
    workflow: Arc<dyn EmailVerificationWorkflow>,
    verification_secret: String,
}

impl EmailVerificationApplication {
    pub fn new(workflow: Arc<dyn EmailVerificationWorkflow>, verification_secret: String) -> Self {
        Self {
            workflow,
            verification_secret,
        }
    }

    pub async fn verify_email(&self, request: VerifyEmailRequest) -> Result<(), AppError> {
        let token_hash = hash_verification_code(&request.code, self.verification_secret.as_bytes());

        self.workflow
            .verify_email(&request.email, &token_hash)
            .await
    }
}
