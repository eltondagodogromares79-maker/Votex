use std::sync::Arc;

use core_infra::AppError;
use uuid::Uuid;

use crate::{
    application::ports::organization_workflow::OrganizationWorkflow,
    contracts::organization::{OrganizationProfile, UpdateOrganizationProfile},
};

pub struct OrganizationApplication {
    workflow: Arc<dyn OrganizationWorkflow>,
}

impl OrganizationApplication {
    pub fn new(workflow: Arc<dyn OrganizationWorkflow>) -> Self {
        Self { workflow }
    }

    pub async fn get(&self, organization_id: Uuid) -> Result<OrganizationProfile, AppError> {
        self.workflow.get_organization(organization_id).await
    }

    pub async fn update(
        &self,
        organization_id: Uuid,
        mut profile: UpdateOrganizationProfile,
    ) -> Result<OrganizationProfile, AppError> {
        profile.name = profile.name.trim().to_owned();
        profile.slug = profile.slug.trim().to_ascii_lowercase();
        if profile.name.is_empty()
            || profile.slug.is_empty()
            || !profile
                .slug
                .chars()
                .all(|ch| ch.is_ascii_lowercase() || ch.is_ascii_digit() || ch == '-')
        {
            return Err(AppError::BadRequest("Organization name and URL slug are required. Slugs may contain lowercase letters, numbers, and hyphens.".into()));
        }
        profile.description = profile
            .description
            .map(|value| value.trim().to_owned())
            .filter(|value| !value.is_empty());
        profile.email = profile
            .email
            .map(|value| value.trim().to_owned())
            .filter(|value| !value.is_empty());
        profile.phone = profile
            .phone
            .map(|value| value.trim().to_owned())
            .filter(|value| !value.is_empty());
        profile.address = profile
            .address
            .map(|value| value.trim().to_owned())
            .filter(|value| !value.is_empty());
        self.workflow
            .update_organization(organization_id, profile)
            .await
    }
}
