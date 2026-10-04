use std::sync::Arc;

use core_infra::AppError;
use uuid::Uuid;

use crate::{
    application::ports::round_workflow::RoundWorkflow,
    contracts::rounds::{CreateRoundRequest, UpdateRoundRequest},
    domain::round::{PageantRound, RoundStatus},
};

pub struct RoundApplication {
    workflow: Arc<dyn RoundWorkflow>,
}

impl RoundApplication {
    pub fn new(workflow: Arc<dyn RoundWorkflow>) -> Self {
        Self { workflow }
    }

    pub async fn list(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
    ) -> Result<Vec<PageantRound>, AppError> {
        self.workflow.list(coordinator_id, pageant_id).await
    }

    pub async fn get(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
        round_id: Uuid,
    ) -> Result<PageantRound, AppError> {
        self.workflow
            .get(coordinator_id, pageant_id, round_id)
            .await
    }

    pub async fn create(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
        request: CreateRoundRequest,
    ) -> Result<PageantRound, AppError> {
        let (name, advancement_count) = validate_fields(
            &request.name,
            request.round_number,
            request.advancement_count,
            request.starts_at,
            request.ends_at,
        )?;
        let now = chrono::Utc::now();
        self.workflow
            .create(
                coordinator_id,
                PageantRound {
                    id: Uuid::new_v4(),
                    pageant_id,
                    name,
                    round_number: request.round_number,
                    round_type: request.round_type,
                    status: RoundStatus::Draft,
                    advancement_count,
                    starts_at: request.starts_at,
                    ends_at: request.ends_at,
                    created_at: now,
                    updated_at: now,
                },
            )
            .await
    }

    pub async fn update(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
        round_id: Uuid,
        request: UpdateRoundRequest,
    ) -> Result<PageantRound, AppError> {
        let current = self
            .workflow
            .get(coordinator_id, pageant_id, round_id)
            .await?;
        if current.status == RoundStatus::Finalized {
            return Err(AppError::Conflict(
                "finalized rounds cannot be changed".to_owned(),
            ));
        }
        if !current.status.can_transition_to(request.status) {
            return Err(AppError::Conflict(format!(
                "round status cannot transition from {} to {}",
                current.status.as_db_str(),
                request.status.as_db_str()
            )));
        }
        let (name, advancement_count) = validate_fields(
            &request.name,
            request.round_number,
            request.advancement_count,
            request.starts_at,
            request.ends_at,
        )?;
        let updated = PageantRound {
            id: round_id,
            pageant_id,
            name,
            round_number: request.round_number,
            round_type: request.round_type,
            status: request.status,
            advancement_count,
            starts_at: request.starts_at,
            ends_at: request.ends_at,
            created_at: current.created_at,
            updated_at: current.updated_at,
        };
        self.workflow
            .update(coordinator_id, updated, current.status)
            .await
    }

    pub async fn delete(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
        round_id: Uuid,
    ) -> Result<(), AppError> {
        self.workflow
            .delete(coordinator_id, pageant_id, round_id)
            .await
    }
}

fn validate_fields(
    raw_name: &str,
    round_number: i32,
    advancement_count: Option<i32>,
    starts_at: Option<chrono::DateTime<chrono::Utc>>,
    ends_at: Option<chrono::DateTime<chrono::Utc>>,
) -> Result<(String, Option<i32>), AppError> {
    let name = raw_name.trim().to_owned();
    if name.is_empty() || name.len() > 150 {
        return Err(AppError::BadRequest(
            "name must be between 1 and 150 characters".to_owned(),
        ));
    }
    if round_number <= 0 {
        return Err(AppError::BadRequest(
            "round_number must be greater than zero".to_owned(),
        ));
    }
    if advancement_count.is_some_and(|count| count <= 0) {
        return Err(AppError::BadRequest(
            "advancement_count must be greater than zero".to_owned(),
        ));
    }
    if starts_at
        .zip(ends_at)
        .is_some_and(|(starts, ends)| ends <= starts)
    {
        return Err(AppError::BadRequest(
            "ends_at must be later than starts_at".to_owned(),
        ));
    }
    Ok((name, advancement_count))
}
