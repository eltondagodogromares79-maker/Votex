use chrono::{Duration, Utc};
use std::sync::Arc;
use uuid::Uuid;

use core_infra::AppError;

use crate::{
    application::ports::email_service::EmailSender,
    application::ports::email_verification_workflow::EmailVerificationWorkflow,
    contracts::registration::VerifyEmailRequest,
    utils::verification::{generate_verification_code, hash_verification_code},
};

pub struct EmailVerificationApplication {
    workflow: Arc<dyn EmailVerificationWorkflow>,
    verification_secret: String,
    email_sender: Arc<dyn EmailSender>,
    email_code_expiry_minutes: i64,
}

impl EmailVerificationApplication {
    pub fn new(
        workflow: Arc<dyn EmailVerificationWorkflow>,
        verification_secret: String,
        email_sender: Arc<dyn EmailSender>,
        email_code_expiry_minutes: i64,
    ) -> Self {
        Self {
            workflow,
            verification_secret,
            email_sender,
            email_code_expiry_minutes,
        }
    }

    pub async fn send_verification_code(&self, user_id: Uuid) -> Result<(), AppError> {
        let code = generate_verification_code();
        let token_hash = hash_verification_code(&code, self.verification_secret.as_bytes());
        let expires_at = Utc::now() + Duration::minutes(self.email_code_expiry_minutes);
        let Some((email, first_name)) = self
            .workflow
            .create_verification_token(user_id, &token_hash, expires_at)
            .await?
        else {
            return Err(AppError::BadRequest(
                "Email is already verified or account is unavailable.".into(),
            ));
        };
        self.email_sender
            .send_verification_email(
                &email,
                &first_name,
                &code,
                self.email_code_expiry_minutes,
                "organization owner",
            )
            .await
    }

    pub async fn verify_email(&self, request: VerifyEmailRequest) -> Result<(), AppError> {
        let token_hash = hash_verification_code(&request.code, self.verification_secret.as_bytes());

        self.workflow
            .verify_email(&request.email, &token_hash)
            .await
    }
}
