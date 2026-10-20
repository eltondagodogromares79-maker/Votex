use std::sync::Arc;

use core_auth::{
    application::ports::email_service::EmailSender,
    utils::{password::hash_password, temporary_password::generate_temporary_password},
};
use core_infra::AppError;
use uuid::Uuid;

use crate::{
    application::ports::judge_workflow::JudgeWorkflow,
    contracts::judges::AssignJudgeRequest,
    domain::judge::{PageantJudge, PageantStaffRole},
};

pub struct CoordinatorJudgeApplication {
    workflow: Arc<dyn JudgeWorkflow>,
    email_sender: Arc<dyn EmailSender>,
}

impl CoordinatorJudgeApplication {
    pub fn new(workflow: Arc<dyn JudgeWorkflow>, email_sender: Arc<dyn EmailSender>) -> Self {
        Self {
            workflow,
            email_sender,
        }
    }

    pub async fn list(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
        role: PageantStaffRole,
    ) -> Result<Vec<PageantJudge>, AppError> {
        self.workflow.list(coordinator_id, pageant_id, role).await
    }

    pub async fn assign(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
        request: AssignJudgeRequest,
        role: PageantStaffRole,
    ) -> Result<PageantJudge, AppError> {
        let temporary_password = generate_temporary_password();
        let password_hash = hash_password(&temporary_password)?;
        let (staff, account_created) = self
            .workflow
            .assign(
                coordinator_id,
                pageant_id,
                coordinator_id,
                request.email.trim(),
                request.first_name.trim(),
                request.last_name.trim(),
                &password_hash,
                role,
                request.confirm_cross_organization_reuse,
            )
            .await?;
        let role_name = match role {
            PageantStaffRole::Judge => "Judge",
            PageantStaffRole::Tabulator => "Tabulator",
        };
        if account_created {
            self.email_sender
                .send_pageant_staff_credentials_email(
                    &staff.email,
                    &staff.first_name,
                    role_name,
                    &temporary_password,
                    &staff.pageant_name,
                    staff.pageant_id,
                    &staff.pageant_slug,
                )
                .await?;
        }
        Ok(staff)
    }

    pub async fn revoke(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
        user_id: Uuid,
        role: PageantStaffRole,
    ) -> Result<(), AppError> {
        self.workflow
            .revoke(coordinator_id, pageant_id, user_id, role)
            .await
    }

    pub async fn activate(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
        user_id: Uuid,
        role: PageantStaffRole,
    ) -> Result<(), AppError> {
        self.workflow
            .activate(coordinator_id, pageant_id, user_id, role)
            .await
    }

    pub async fn delete_assignment(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
        user_id: Uuid,
        role: PageantStaffRole,
    ) -> Result<(), AppError> {
        self.workflow
            .delete_assignment(coordinator_id, pageant_id, user_id, role)
            .await
    }
}
