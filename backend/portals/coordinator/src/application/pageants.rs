use std::sync::Arc;

use core_infra::AppError;
use uuid::Uuid;

use crate::{
    application::ports::pageant_workflow::PageantWorkflow,
    contracts::pageants::UpdateAssignedPageantRequest, domain::pageant::AssignedPageant,
};

pub struct CoordinatorPageantApplication {
    workflow: Arc<dyn PageantWorkflow>,
}

impl CoordinatorPageantApplication {
    pub fn new(workflow: Arc<dyn PageantWorkflow>) -> Self {
        Self { workflow }
    }

    pub async fn list_assigned(
        &self,
        coordinator_id: Uuid,
    ) -> Result<Vec<AssignedPageant>, AppError> {
        self.workflow.list_assigned(coordinator_id).await
    }

    pub async fn get_assigned(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
    ) -> Result<AssignedPageant, AppError> {
        self.workflow.get_assigned(coordinator_id, pageant_id).await
    }

    pub async fn update_assigned(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
        request: UpdateAssignedPageantRequest,
    ) -> Result<AssignedPageant, AppError> {
        let (name, slug) = validate_fields(
            &request.name,
            &request.slug,
            request.start_time,
            request.end_time,
        )?;
        let mut pageant = self
            .workflow
            .get_assigned(coordinator_id, pageant_id)
            .await?;
        if pageant.status == "ARCHIVED" {
            return Err(AppError::Conflict(
                "archived pageants cannot be updated".to_owned(),
            ));
        }
        pageant.name = name;
        pageant.slug = slug;
        pageant.description = request.description;
        pageant.logo_url = request.logo_url;
        pageant.event_date = request.event_date;
        pageant.start_time = request.start_time;
        pageant.end_time = request.end_time;
        pageant.venue = request.venue;
        pageant.is_public = request.is_public;
        self.workflow.update_assigned(coordinator_id, pageant).await
    }
}

fn validate_fields(
    raw_name: &str,
    raw_slug: &str,
    start_time: Option<chrono::NaiveTime>,
    end_time: Option<chrono::NaiveTime>,
) -> Result<(String, String), AppError> {
    let name = raw_name.trim().to_owned();
    let slug = raw_slug.trim().to_ascii_lowercase();
    if name.is_empty() || name.len() > 200 {
        return Err(AppError::BadRequest(
            "name must be between 1 and 200 characters".to_owned(),
        ));
    }
    if !(3..=100).contains(&slug.len())
        || !slug
            .bytes()
            .all(|byte| byte.is_ascii_lowercase() || byte.is_ascii_digit() || byte == b'-')
        || slug.starts_with('-')
        || slug.ends_with('-')
    {
        return Err(AppError::BadRequest(
            "slug must be 3-100 lowercase letters, numbers, and hyphens".to_owned(),
        ));
    }
    if start_time
        .zip(end_time)
        .is_some_and(|(start, end)| end <= start)
    {
        return Err(AppError::BadRequest(
            "end_time must be later than start_time".to_owned(),
        ));
    }
    Ok((name, slug))
}
