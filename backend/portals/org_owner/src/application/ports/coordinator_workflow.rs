use async_trait::async_trait;
use core_infra::AppError;
use uuid::Uuid;

use crate::domain::coordinator::OrganizationCoordinator;

#[cfg_attr(test, mockall::automock)]
#[async_trait]
pub trait CoordinatorWorkflow: Send + Sync {
    /// Create a new coordinator account or link an existing user.
    async fn add_coordinator(
        &self,
        organization_id: Uuid,
        assigned_by: Uuid,
        email: &str,
        first_name: &str,
        last_name: &str,
        password_hash: &str,
    ) -> Result<(OrganizationCoordinator, bool), AppError>;

    /// List all active coordinators for the organization.
    async fn list_coordinators(
        &self,
        organization_id: Uuid,
    ) -> Result<Vec<OrganizationCoordinator>, AppError>;

    /// Get a single coordinator by user_id.
    async fn get_coordinator(
        &self,
        organization_id: Uuid,
        user_id: Uuid,
    ) -> Result<OrganizationCoordinator, AppError>;

    /// Replace the coordinator slot with a different user account.
    async fn replace_coordinator(
        &self,
        organization_id: Uuid,
        current_user_id: Uuid,
        assigned_by: Uuid,
        email: &str,
    ) -> Result<OrganizationCoordinator, AppError>;

    /// Update the coordinator's profile fields (name, email) in-place.
    async fn update_coordinator(
        &self,
        organization_id: Uuid,
        user_id: Uuid,
        first_name: &str,
        last_name: &str,
        email: &str,
    ) -> Result<OrganizationCoordinator, AppError>;

    /// Update the coordinator's password hash (used when resending credentials).
    async fn update_coordinator_password(
        &self,
        organization_id: Uuid,
        user_id: Uuid,
        password_hash: &str,
    ) -> Result<(), AppError>;

    /// Remove the coordinator role from a user.
    async fn remove_coordinator(
        &self,
        organization_id: Uuid,
        user_id: Uuid,
    ) -> Result<(), AppError>;
}
