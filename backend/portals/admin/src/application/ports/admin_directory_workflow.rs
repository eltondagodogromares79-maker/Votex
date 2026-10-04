use async_trait::async_trait;
use core_infra::AppError;
use uuid::Uuid;

use crate::domain::directory::{AdminOrganization, AdminPageant, AdminUser};

#[async_trait]
pub trait AdminDirectoryWorkflow: Send + Sync {
    async fn list_users(&self, limit: i64, offset: i64) -> Result<Vec<AdminUser>, AppError>;
    async fn get_user(&self, id: Uuid) -> Result<AdminUser, AppError>;
    async fn list_organizations(
        &self,
        limit: i64,
        offset: i64,
    ) -> Result<Vec<AdminOrganization>, AppError>;
    async fn get_organization(&self, id: Uuid) -> Result<AdminOrganization, AppError>;
    async fn list_pageants(&self, limit: i64, offset: i64) -> Result<Vec<AdminPageant>, AppError>;
    async fn get_pageant(&self, id: Uuid) -> Result<AdminPageant, AppError>;
}
