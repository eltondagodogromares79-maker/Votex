use async_trait::async_trait;
use core_infra::AppError;
use uuid::Uuid;

use crate::domain::vote_package::VotePackage;

#[cfg_attr(test, mockall::automock)]
#[async_trait]
pub trait VotePackageWorkflow: Send + Sync {
    async fn list(
        &self,
        organization_id: Uuid,
        pageant_id: Uuid,
    ) -> Result<Vec<VotePackage>, AppError>;

    async fn create(
        &self,
        organization_id: Uuid,
        package: VotePackage,
    ) -> Result<VotePackage, AppError>;

    async fn update(
        &self,
        organization_id: Uuid,
        package: VotePackage,
    ) -> Result<VotePackage, AppError>;

    async fn deactivate(
        &self,
        organization_id: Uuid,
        pageant_id: Uuid,
        package_id: Uuid,
    ) -> Result<(), AppError>;

    async fn activate(
        &self,
        organization_id: Uuid,
        pageant_id: Uuid,
        package_id: Uuid,
    ) -> Result<(), AppError>;
}
