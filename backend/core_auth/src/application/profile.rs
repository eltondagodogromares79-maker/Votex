use crate::{
    application::ports::profile_workflow::ProfileWorkflow,
    contracts::profile::{
        DeleteAccountRequest, ProfileResponse, RequestEmailChange, UpdateProfileRequest,
    },
};
use core_infra::AppError;
use std::sync::Arc;
use uuid::Uuid;

pub struct ProfileApplication {
    workflow: Arc<dyn ProfileWorkflow>,
}

impl ProfileApplication {
    pub fn new(workflow: Arc<dyn ProfileWorkflow>) -> Self {
        Self { workflow }
    }

    /// Return the authenticated user's profile.
    /// `role` is extracted from the validated JWT claim by the handler.
    pub async fn get(&self, id: Uuid, role: &str) -> Result<ProfileResponse, AppError> {
        self.workflow.get(id, role).await
    }

    pub async fn update(
        &self,
        id: Uuid,
        role: &str,
        profile: UpdateProfileRequest,
    ) -> Result<ProfileResponse, AppError> {
        if profile.first_name.trim().is_empty() || profile.last_name.trim().is_empty() {
            return Err(AppError::BadRequest(
                "first_name and last_name cannot be blank".to_owned(),
            ));
        }
        let profile = UpdateProfileRequest {
            first_name: profile.first_name.trim().to_owned(),
            middle_name: profile
                .middle_name
                .map(|v| v.trim().to_owned())
                .filter(|v| !v.is_empty()),
            last_name: profile.last_name.trim().to_owned(),
            phone: profile
                .phone
                .map(|v| v.trim().to_owned())
                .filter(|v| !v.is_empty()),
            profile_image_url: profile
                .profile_image_url
                .map(|v| v.trim().to_owned())
                .filter(|v| !v.is_empty()),
        };
        self.workflow.update(id, role, profile).await
    }

    pub async fn request_email_change(
        &self,
        id: Uuid,
        role: &str,
        request: RequestEmailChange,
    ) -> Result<ProfileResponse, AppError> {
        let email = request.email.trim().to_owned();
        if email.is_empty() {
            return Err(AppError::BadRequest("email cannot be blank".to_owned()));
        }
        self.workflow
            .request_email_change(id, role, RequestEmailChange { email })
            .await
    }

    pub async fn delete_account(
        &self,
        id: Uuid,
        request: DeleteAccountRequest,
    ) -> Result<(), AppError> {
        if request.confirmation != "DELETE" {
            return Err(AppError::BadRequest(
                "Type DELETE to confirm account deletion.".to_owned(),
            ));
        }
        self.workflow
            .delete_account(id, &request.current_password)
            .await
    }
}
