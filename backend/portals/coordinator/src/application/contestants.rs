use std::sync::Arc;

use core_infra::AppError;
use uuid::Uuid;

use crate::{
    application::ports::contestant_workflow::ContestantWorkflow,
    contracts::contestants::ContestantRequest,
    domain::contestant::{Contestant, ContestantPlacements},
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
        validate_gender(request.gender.as_deref(), None)?;
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
        let current = self
            .workflow
            .get(coordinator_id, pageant_id, contestant_id)
            .await?;
        validate_gender(request.gender.as_deref(), current.gender.as_deref())?;
        let mut contestant = to_contestant(contestant_id, pageant_id, request)?;
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

    pub async fn get_placements(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
        contestant_id: Uuid,
    ) -> Result<ContestantPlacements, AppError> {
        self.workflow
            .get_placements(coordinator_id, pageant_id, contestant_id)
            .await
    }

    pub async fn save_placements(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
        contestant_id: Uuid,
        request: crate::contracts::contestants::ContestantPlacementsRequest,
    ) -> Result<ContestantPlacements, AppError> {
        let mut category_ids = request.category_ids;
        let category_count = category_ids.len();
        category_ids.sort_unstable();
        category_ids.dedup();
        let mut round_ids = request.round_ids;
        let round_count = round_ids.len();
        round_ids.sort_unstable();
        round_ids.dedup();
        if category_ids.len() != category_count || round_ids.len() != round_count {
            return Err(AppError::BadRequest(
                "category_ids and round_ids must not contain duplicates".to_owned(),
            ));
        }
        self.workflow
            .save_placements(
                coordinator_id,
                pageant_id,
                contestant_id,
                ContestantPlacements {
                    category_ids,
                    round_ids,
                },
            )
            .await
    }
}

fn validate_gender(gender: Option<&str>, current_gender: Option<&str>) -> Result<(), AppError> {
    let Some(gender) = gender.map(str::trim).filter(|value| !value.is_empty()) else {
        return Err(AppError::BadRequest(
            "gender is required and must be Male or Female".to_owned(),
        ));
    };

    if matches!(gender, "Male" | "Female")
        || current_gender.is_some_and(|current| current.trim() == gender)
    {
        return Ok(());
    }

    Err(AppError::BadRequest(
        "gender must be Male or Female".to_owned(),
    ))
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
        current_round_status: None,
        current_round_name: None,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    })
}

#[cfg(test)]
mod tests {
    use super::validate_gender;

    #[test]
    fn only_supported_gender_values_are_accepted() {
        assert!(validate_gender(Some("Male"), None).is_ok());
        assert!(validate_gender(Some("Female"), None).is_ok());
        assert!(validate_gender(Some("Other"), None).is_err());
        assert!(validate_gender(None, None).is_err());
        assert!(validate_gender(Some("  "), None).is_err());
    }

    #[test]
    fn existing_gender_value_is_allowed_for_legacy_records() {
        assert!(validate_gender(Some("Nonbinary"), Some("Nonbinary")).is_ok());
        assert!(validate_gender(Some("Nonbinary"), Some("Female")).is_err());
    }
}
