use async_trait::async_trait;
use core_infra::AppError;
use uuid::Uuid;

use crate::domain::pageant_staff::{PageantStaffMember, PageantStaffRole};

#[async_trait]
pub trait PageantStaffWorkflow: Send + Sync {
    async fn assign(
        &self,
        organization_id: Uuid,
        pageant_id: Uuid,
        assigned_by: Uuid,
        email: &str,
        first_name: Option<&str>,
        last_name: Option<&str>,
        password_hash: Option<&str>,
        role: PageantStaffRole,
        confirm_cross_organization_reuse: bool,
    ) -> Result<(PageantStaffMember, bool), AppError>;

    async fn list(
        &self,
        organization_id: Uuid,
        pageant_id: Uuid,
        role: PageantStaffRole,
    ) -> Result<Vec<PageantStaffMember>, AppError>;

    async fn revoke(
        &self,
        organization_id: Uuid,
        pageant_id: Uuid,
        user_id: Uuid,
        role: PageantStaffRole,
    ) -> Result<(), AppError>;
    async fn activate(
        &self,
        organization_id: Uuid,
        pageant_id: Uuid,
        user_id: Uuid,
        role: PageantStaffRole,
    ) -> Result<(), AppError>;
    async fn delete_assignment(
        &self,
        organization_id: Uuid,
        pageant_id: Uuid,
        user_id: Uuid,
        role: PageantStaffRole,
    ) -> Result<(), AppError>;
}
