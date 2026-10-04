use async_trait::async_trait;
use core_infra::AppError;
use uuid::Uuid;

#[async_trait]
pub trait PasswordManagementWorkflow: Send + Sync {
    async fn change_password(
        &self,
        user_id: Uuid,
        current_password: &str,
        new_password_hash: &str,
    ) -> Result<(), AppError>;
}
