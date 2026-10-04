use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

use crate::domain::coordinator::OrganizationCoordinator;

/// POST /api/v1/organizations/:org_id/coordinators
/// Links an existing user or creates a new account.
#[derive(Debug, Deserialize, Validate)]
pub struct CreateCoordinatorRequest {
    #[validate(email)]
    pub email: String,
    #[validate(length(min = 1, max = 100))]
    pub first_name: String,
    #[validate(length(min = 1, max = 100))]
    pub last_name: String,
}

/// PUT /api/v1/organizations/:org_id/coordinators/:user_id
/// Replaces the coordinator slot with a different user account by email.
#[derive(Debug, Deserialize, Validate)]
pub struct CoordinatorRequest {
    #[validate(email)]
    pub email: String,
}

/// PATCH /api/v1/organizations/:org_id/coordinators/:user_id
/// Updates the coordinator's own profile fields (name, email) in-place.
#[derive(Debug, Deserialize, Validate)]
pub struct UpdateCoordinatorRequest {
    #[validate(email)]
    pub email: String,
    #[validate(length(min = 1, max = 100))]
    pub first_name: String,
    #[validate(length(min = 1, max = 100))]
    pub last_name: String,
}

/// POST /api/v1/organizations/:org_id/coordinators/:user_id/resend-credentials
/// Generates a new temporary password and emails it to the coordinator.
/// No request body needed.

/// Response shape for all coordinator endpoints.
#[derive(Debug, Serialize)]
pub struct CoordinatorResponse {
    pub organization_id: Uuid,
    pub user_id: Uuid,
    pub role: &'static str,
    pub email: String,
    pub first_name: String,
    pub last_name: String,
    pub is_active: bool,
}

impl From<OrganizationCoordinator> for CoordinatorResponse {
    fn from(coordinator: OrganizationCoordinator) -> Self {
        Self {
            organization_id: coordinator.organization_id,
            user_id: coordinator.user_id,
            role: "ORG_COORDINATOR",
            email: coordinator.email,
            first_name: coordinator.first_name,
            last_name: coordinator.last_name,
            is_active: coordinator.is_active,
        }
    }
}

/// Generic success message response.
#[derive(Debug, Serialize)]
pub struct MessageResponse {
    pub message: String,
}
