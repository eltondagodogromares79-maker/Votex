use crate::contracts::profile::{ProfileResponse, UpdateProfileRequest};
use async_trait::async_trait;
use core_infra::AppError;
use uuid::Uuid;

#[async_trait]
pub trait ProfileWorkflow: Send + Sync {
    /// Load profile from the database.
    /// `role` comes from the validated JWT claim — no extra RBAC query needed.
    /// The workflow resolves `organization_id` from the DB for org-scoped roles.
    async fn get(&self, user_id: Uuid, role: &str) -> Result<ProfileResponse, AppError>;

    /// Update mutable profile fields. Role is not changed by profile updates.
    async fn update(
        &self,
        user_id: Uuid,
        role: &str,
        profile: UpdateProfileRequest,
    ) -> Result<ProfileResponse, AppError>;
}
