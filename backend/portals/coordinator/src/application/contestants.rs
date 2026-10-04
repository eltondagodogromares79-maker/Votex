use std::sync::Arc;

use core_infra::AppError;
use uuid::Uuid;

use crate::{
    application::ports::contestant_workflow::ContestantWorkflow,
    contracts::contestants::ContestantRequest, domain::contestant::Contestant,
};

pub struct ContestantApplication {
    workflow: Arc<dyn ContestantWorkflow>,
}

impl ContestantApplication {
    pub fn new(workflow: Arc<dyn ContestantWorkflow>) -> Self {
        Self { workflow }
    }

    pub async fn list(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
    ) -> Result<Vec<Contestant>, AppError> {
        self.workflow.list(coordinator_id, pageant_id).await
    }

    pub async fn get(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
        contestant_id: Uuid,
    ) -> Result<Contestant, AppError> {
        self.workflow
            .get(coordinator_id, pageant_id, contestant_id)
            .await
    }

    pub async fn create(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
        request: ContestantRequest,
    ) -> Result<Contestant, AppError> {
        let mut contestant = to_contestant(Uuid::new_v4(), pageant_id, request)?;
        contestant.is_active = true;
        self.workflow.create(coordinator_id, contestant).await
    }

    pub async fn update(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
        contestant_id: Uuid,
        request: ContestantRequest,
    ) -> Result<Contestant, AppError> {
        let mut contestant = to_contestant(contestant_id, pageant_id, request)?;
        let current = self
            .workflow
            .get(coordinator_id, pageant_id, contestant_id)
            .await?;
        contestant.is_active = current.is_active;
        contestant.created_at = current.created_at;
        self.workflow.update(coordinator_id, contestant).await
    }

    pub async fn deactivate(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
        contestant_id: Uuid,
    ) -> Result<(), AppError> {
        self.workflow
            .deactivate(coordinator_id, pageant_id, contestant_id)
            .await
    }
}

fn to_contestant(
    id: Uuid,
    pageant_id: Uuid,
    request: ContestantRequest,
) -> Result<Contestant, AppError> {
    let first_name = request.first_name.trim().to_owned();
    let middle_name = request
        .middle_name
        .map(|value| value.trim().to_owned())
        .filter(|value| !value.is_empty());
    let last_name = request.last_name.trim().to_owned();
    let display_name = request
        .display_name
        .map(|value| value.trim().to_owned())
        .filter(|value| !value.is_empty())
        .unwrap_or_else(|| {
            [
                Some(first_name.clone()),
                middle_name.clone(),
                Some(last_name.clone()),
            ]
            .into_iter()
            .flatten()
            .collect::<Vec<_>>()
            .join(" ")
        });
    if first_name.is_empty() || last_name.is_empty() {
        return Err(AppError::BadRequest(
            "first_name and last_name must not be blank".to_owned(),
        ));
    }
    if display_name.is_empty() || display_name.len() > 250 {
        return Err(AppError::BadRequest(
            "display_name must be between 1 and 250 characters".to_owned(),
        ));
    }
    if request.contestant_number <= 0 {
        return Err(AppError::BadRequest(
            "contestant_number must be greater than zero".to_owned(),
        ));
    }

    Ok(Contestant {
        id,
        pageant_id,
        user_id: request.user_id,
        contestant_number: request.contestant_number,
        first_name,
        middle_name,
        last_name,
        display_name,
        gender: request
            .gender
            .map(|value| value.trim().to_owned())
            .filter(|value| !value.is_empty()),
        photo_url: request.photo_url,
        biography: request.biography,
        is_active: true,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    })
}
