use async_trait::async_trait;
use core_infra::AppError;
use uuid::Uuid;

use crate::domain::judge::{PageantJudge, PageantStaffRole};

#[async_trait]
pub trait JudgeWorkflow: Send + Sync {
    async fn list(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
        role: PageantStaffRole,
    ) -> Result<Vec<PageantJudge>, AppError>;
    async fn assign(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
        assigned_by: Uuid,
        email: &str,
        first_name: &str,
        last_name: &str,
        password_hash: &str,
        role: PageantStaffRole,
    ) -> Result<(PageantJudge, bool), AppError>;
    async fn revoke(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
        user_id: Uuid,
        role: PageantStaffRole,
    ) -> Result<(), AppError>;
}
