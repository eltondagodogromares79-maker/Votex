use std::sync::Arc;

use core_infra::AppError;
use uuid::Uuid;

use crate::{
    application::ports::admin_directory_workflow::AdminDirectoryWorkflow,
    domain::directory::{AdminOrganization, AdminPageant, AdminUser},
};

pub struct AdminDirectoryApplication {
    workflow: Arc<dyn AdminDirectoryWorkflow>,
}

impl AdminDirectoryApplication {
    pub fn new(workflow: Arc<dyn AdminDirectoryWorkflow>) -> Self {
        Self { workflow }
    }

    pub async fn list_users(&self, limit: i64, offset: i64) -> Result<Vec<AdminUser>, AppError> {
        self.workflow.list_users(limit, offset).await
    }

    pub async fn get_user(&self, id: Uuid) -> Result<AdminUser, AppError> {
        self.workflow.get_user(id).await
    }

    pub async fn list_organizations(
        &self,
        limit: i64,
        offset: i64,
    ) -> Result<Vec<AdminOrganization>, AppError> {
        self.workflow.list_organizations(limit, offset).await
    }

    pub async fn get_organization(&self, id: Uuid) -> Result<AdminOrganization, AppError> {
        self.workflow.get_organization(id).await
    }

    pub async fn list_pageants(&self, limit: i64, offset: i64) -> Result<Vec<AdminPageant>, AppError> {
        self.workflow.list_pageants(limit, offset).await
    }

    pub async fn get_pageant(&self, id: Uuid) -> Result<AdminPageant, AppError> {
        self.workflow.get_pageant(id).await
    }
}
