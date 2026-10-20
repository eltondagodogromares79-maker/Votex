use async_trait::async_trait;
use core_infra::AppError;
use uuid::Uuid;

use crate::contracts::organization::{OrganizationProfile, UpdateOrganizationProfile};

#[cfg_attr(test, mockall::automock)]
#[async_trait]
pub trait OrganizationWorkflow: Send + Sync {
    async fn get_organization(
        &self,
        organization_id: Uuid,
    ) -> Result<OrganizationProfile, AppError>;
    async fn update_organization(
        &self,
        organization_id: Uuid,
        profile: UpdateOrganizationProfile,
    ) -> Result<OrganizationProfile, AppError>;
}
