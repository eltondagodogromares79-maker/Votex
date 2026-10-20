use std::sync::Arc;

use core_auth::{
    application::ports::email_service::EmailSender,
    utils::{password::hash_password, temporary_password::generate_temporary_password},
};
use core_infra::AppError;
use uuid::Uuid;

use crate::{
    application::ports::pageant_staff_workflow::PageantStaffWorkflow,
    contracts::pageant_staff::AssignPageantStaffRequest,
    domain::pageant_staff::{PageantStaffMember, PageantStaffRole},
};

pub struct PageantStaffApplication {
    workflow: Arc<dyn PageantStaffWorkflow>,
    email_sender: Arc<dyn EmailSender>,
}

impl PageantStaffApplication {
    pub fn new(
        workflow: Arc<dyn PageantStaffWorkflow>,
        email_sender: Arc<dyn EmailSender>,
    ) -> Self {
        Self {
            workflow,
            email_sender,
        }
    }

    pub async fn assign(
        &self,
        organization_id: Uuid,
        pageant_id: Uuid,
        assigned_by: Uuid,
        request: AssignPageantStaffRequest,
        role: PageantStaffRole,
    ) -> Result<PageantStaffMember, AppError> {
        let mut temporary_password = None;
        let mut first_name = request.first_name.as_deref().map(str::trim);
        let mut last_name = request.last_name.as_deref().map(str::trim);
        let password_hash = if role == PageantStaffRole::Coordinator {
            None
        } else {
            first_name = Some(first_name.filter(|s| !s.is_empty()).ok_or_else(|| {
                AppError::BadRequest(
                    "first_name is required for judge and tabulator accounts".to_owned(),
                )
            })?);
            last_name = Some(last_name.filter(|s| !s.is_empty()).ok_or_else(|| {
                AppError::BadRequest(
                    "last_name is required for judge and tabulator accounts".to_owned(),
                )
            })?);
            let password = generate_temporary_password();
            let hash = hash_password(&password)?;
            temporary_password = Some(password);
            Some(hash)
        };
        let (member, account_created) = self
            .workflow
            .assign(
                organization_id,
                pageant_id,
                assigned_by,
                request.email.trim(),
                first_name,
                last_name,
                password_hash.as_deref(),
                role,
                request.confirm_cross_organization_reuse,
            )
            .await?;
        if let (Some(password), true) = (temporary_password, account_created) {
            let role_name = match role {
                PageantStaffRole::Judge => "Judge",
                PageantStaffRole::Tabulator => "Tabulator",
                PageantStaffRole::Coordinator => unreachable!(),
            };
            self.email_sender
                .send_pageant_staff_credentials_email(
                    &member.email,
                    &member.first_name,
                    role_name,
                    &password,
                    &member.pageant_name,
                    member.pageant_id,
                    &member.pageant_slug,
                )
                .await?;
        }
        Ok(member)
    }

    pub async fn list(
        &self,
        organization_id: Uuid,
        pageant_id: Uuid,
        role: PageantStaffRole,
    ) -> Result<Vec<PageantStaffMember>, AppError> {
        self.workflow.list(organization_id, pageant_id, role).await
    }

    pub async fn revoke(
        &self,
        organization_id: Uuid,
        pageant_id: Uuid,
        user_id: Uuid,
        role: PageantStaffRole,
    ) -> Result<(), AppError> {
        self.workflow
            .revoke(organization_id, pageant_id, user_id, role)
            .await
    }

    pub async fn activate(
        &self,
        organization_id: Uuid,
        pageant_id: Uuid,
        user_id: Uuid,
        role: PageantStaffRole,
    ) -> Result<(), AppError> {
        self.workflow
            .activate(organization_id, pageant_id, user_id, role)
            .await
    }

    pub async fn delete_assignment(
        &self,
        organization_id: Uuid,
        pageant_id: Uuid,
        user_id: Uuid,
        role: PageantStaffRole,
    ) -> Result<(), AppError> {
        self.workflow
            .delete_assignment(organization_id, pageant_id, user_id, role)
            .await
    }
}
