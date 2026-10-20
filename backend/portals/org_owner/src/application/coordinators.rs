use std::sync::Arc;

use core_auth::{
    application::ports::email_service::EmailSender,
    utils::{password::hash_password, temporary_password::generate_temporary_password},
};
use core_infra::AppError;
use uuid::Uuid;

use crate::{
    application::ports::coordinator_workflow::CoordinatorWorkflow,
    contracts::coordinators::{CoordinatorRequest, CreateCoordinatorRequest},
    domain::coordinator::OrganizationCoordinator,
};

pub struct CoordinatorApplication {
    workflow: Arc<dyn CoordinatorWorkflow>,
    email_sender: Arc<dyn EmailSender>,
}

impl CoordinatorApplication {
    pub fn new(workflow: Arc<dyn CoordinatorWorkflow>, email_sender: Arc<dyn EmailSender>) -> Self {
        Self {
            workflow,
            email_sender,
        }
    }

    // ── Create ────────────────────────────────────────────────────────────────

    pub async fn add(
        &self,
        organization_id: Uuid,
        assigned_by: Uuid,
        request: CreateCoordinatorRequest,
    ) -> Result<OrganizationCoordinator, AppError> {
        let temporary_password = generate_temporary_password();
        let password_hash = hash_password(&temporary_password)?;
        let (coordinator, account_created) = self
            .workflow
            .add_coordinator(
                organization_id,
                assigned_by,
                request.email.trim(),
                request.first_name.trim(),
                request.last_name.trim(),
                &password_hash,
            )
            .await?;
        if account_created {
            self.email_sender
                .send_staff_credentials_email(
                    &coordinator.email,
                    &coordinator.first_name,
                    "Coordinator",
                    &temporary_password,
                )
                .await?;
        }
        Ok(coordinator)
    }

    // ── Read ──────────────────────────────────────────────────────────────────

    pub async fn list(
        &self,
        organization_id: Uuid,
    ) -> Result<Vec<OrganizationCoordinator>, AppError> {
        self.workflow.list_coordinators(organization_id).await
    }

    pub async fn get(
        &self,
        organization_id: Uuid,
        user_id: Uuid,
    ) -> Result<OrganizationCoordinator, AppError> {
        self.workflow
            .get_coordinator(organization_id, user_id)
            .await
    }

    // ── Update ────────────────────────────────────────────────────────────────

    /// Update the coordinator's profile fields (first name, last name, email).
    pub async fn update(
        &self,
        organization_id: Uuid,
        user_id: Uuid,
        first_name: &str,
        last_name: &str,
        email: &str,
    ) -> Result<OrganizationCoordinator, AppError> {
        self.workflow
            .update_coordinator(organization_id, user_id, first_name, last_name, email)
            .await
    }

    /// Replace the coordinator slot with a different user account.
    pub async fn replace(
        &self,
        organization_id: Uuid,
        current_user_id: Uuid,
        assigned_by: Uuid,
        request: CoordinatorRequest,
    ) -> Result<OrganizationCoordinator, AppError> {
        self.workflow
            .replace_coordinator(
                organization_id,
                current_user_id,
                assigned_by,
                request.email.trim(),
            )
            .await
    }

    // ── Delete ────────────────────────────────────────────────────────────────

    pub async fn remove(&self, organization_id: Uuid, user_id: Uuid) -> Result<(), AppError> {
        self.workflow
            .remove_coordinator(organization_id, user_id)
            .await
    }

    pub async fn set_active(
        &self,
        organization_id: Uuid,
        user_id: Uuid,
        is_active: bool,
    ) -> Result<(), AppError> {
        self.workflow
            .set_coordinator_active(organization_id, user_id, is_active)
            .await
    }

    // ── Resend credentials ────────────────────────────────────────────────────

    /// Generate a new temporary password and email it to the coordinator.
    pub async fn resend_credentials(
        &self,
        organization_id: Uuid,
        user_id: Uuid,
    ) -> Result<(), AppError> {
        let coordinator = self
            .workflow
            .get_coordinator(organization_id, user_id)
            .await?;

        let temporary_password = generate_temporary_password();
        let password_hash = hash_password(&temporary_password)?;

        self.workflow
            .update_coordinator_password(organization_id, user_id, &password_hash)
            .await?;

        self.email_sender
            .send_staff_credentials_email(
                &coordinator.email,
                &coordinator.first_name,
                "Coordinator",
                &temporary_password,
            )
            .await?;

        Ok(())
    }
}
