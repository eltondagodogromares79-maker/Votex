use async_trait::async_trait;

use core_infra::AppError;

use crate::domain::models::user::User;

#[cfg_attr(test, mockall::automock)]
#[async_trait]
pub trait AuthenticationWorkflow: Send + Sync {
    async fn authenticate(&self, email: &str, password: &str) -> Result<User, AppError>;
}
