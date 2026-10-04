use std::sync::Arc;

use core_infra::AppError;
use rust_decimal::Decimal;
use uuid::Uuid;

use crate::{
    application::ports::pageant_setup_workflow::PageantSetupWorkflow,
    contracts::pageant_setup::{CategoryRequest, CriterionRequest},
    domain::pageant_setup::{JudgingCriterion, PageantCategory},
};

pub struct PageantSetupApplication {
    workflow: Arc<dyn PageantSetupWorkflow>,
}

impl PageantSetupApplication {
    pub fn new(workflow: Arc<dyn PageantSetupWorkflow>) -> Self {
        Self { workflow }
    }

    pub async fn list_categories(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
    ) -> Result<Vec<PageantCategory>, AppError> {
        self.workflow
            .list_categories(coordinator_id, pageant_id)
            .await
    }

    pub async fn get_category(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
        category_id: Uuid,
    ) -> Result<PageantCategory, AppError> {
        self.workflow
            .get_category(coordinator_id, pageant_id, category_id)
            .await
    }

    pub async fn create_category(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
        request: CategoryRequest,
    ) -> Result<PageantCategory, AppError> {
        let (code, name) = validate_code_name(&request.code, &request.name)?;
        if request.display_order < 0 {
            return Err(AppError::BadRequest(
                "display_order must not be negative".to_owned(),
            ));
        }
        let now = chrono::Utc::now();
        self.workflow
            .create_category(
                coordinator_id,
                PageantCategory {
                    id: Uuid::new_v4(),
                    pageant_id,
                    code,
                    name,
                    description: request.description,
                    display_order: request.display_order,
                    is_active: true,
                    created_at: now,
                    updated_at: now,
                },
            )
            .await
    }

    pub async fn update_category(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
        category_id: Uuid,
        request: CategoryRequest,
    ) -> Result<PageantCategory, AppError> {
        let (code, name) = validate_code_name(&request.code, &request.name)?;
        if request.display_order < 0 {
            return Err(AppError::BadRequest(
                "display_order must not be negative".to_owned(),
            ));
        }
        self.workflow
            .get_category(coordinator_id, pageant_id, category_id)
            .await?;
        let now = chrono::Utc::now();
        self.workflow
            .update_category(
                coordinator_id,
                PageantCategory {
                    id: category_id,
                    pageant_id,
                    code,
                    name,
                    description: request.description,
                    display_order: request.display_order,
                    is_active: true,
                    created_at: now,
                    updated_at: now,
                },
            )
            .await
    }

    pub async fn deactivate_category(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
        category_id: Uuid,
    ) -> Result<(), AppError> {
        self.workflow
            .deactivate_category(coordinator_id, pageant_id, category_id)
            .await
    }

    pub async fn list_criteria(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
    ) -> Result<Vec<JudgingCriterion>, AppError> {
        self.workflow
            .list_criteria(coordinator_id, pageant_id)
            .await
    }

    pub async fn get_criterion(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
        criterion_id: Uuid,
    ) -> Result<JudgingCriterion, AppError> {
        self.workflow
            .get_criterion(coordinator_id, pageant_id, criterion_id)
            .await
    }

    pub async fn create_criterion(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
        request: CriterionRequest,
    ) -> Result<JudgingCriterion, AppError> {
        let criterion = to_criterion(Uuid::new_v4(), pageant_id, request)?;
        self.workflow
            .create_criterion(coordinator_id, criterion)
            .await
    }

    pub async fn update_criterion(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
        criterion_id: Uuid,
        request: CriterionRequest,
    ) -> Result<JudgingCriterion, AppError> {
        self.workflow
            .get_criterion(coordinator_id, pageant_id, criterion_id)
            .await?;
        let criterion = to_criterion(criterion_id, pageant_id, request)?;
        self.workflow
            .update_criterion(coordinator_id, criterion)
            .await
    }

    pub async fn deactivate_criterion(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
        criterion_id: Uuid,
    ) -> Result<(), AppError> {
        self.workflow
            .deactivate_criterion(coordinator_id, pageant_id, criterion_id)
            .await
    }
}

fn validate_code_name(raw_code: &str, raw_name: &str) -> Result<(String, String), AppError> {
    let code = raw_code.trim().to_ascii_uppercase();
    let name = raw_name.trim().to_owned();
    if code.is_empty()
        || code.len() > 80
        || !code
            .bytes()
            .all(|byte| byte.is_ascii_uppercase() || byte.is_ascii_digit() || byte == b'_')
    {
        return Err(AppError::BadRequest(
            "code must contain 1-80 uppercase letters, numbers, or underscores".to_owned(),
        ));
    }
    if name.is_empty() || name.len() > 150 {
        return Err(AppError::BadRequest(
            "name must be between 1 and 150 characters".to_owned(),
        ));
    }
    Ok((code, name))
}

fn to_criterion(
    id: Uuid,
    pageant_id: Uuid,
    request: CriterionRequest,
) -> Result<JudgingCriterion, AppError> {
    let (code, name) = validate_code_name(&request.code, &request.name)?;
    let max_precision = Decimal::new(99_999_999, 3);
    if request.default_maximum_score <= Decimal::ZERO
        || request.default_maximum_score > max_precision
        || request.default_minimum_score < Decimal::ZERO
        || request.default_minimum_score > max_precision
        || request.default_minimum_score > request.default_maximum_score
        || request.default_maximum_score.scale() > 3
        || request.default_minimum_score.scale() > 3
    {
        return Err(AppError::BadRequest(
            "scores must fit NUMERIC(8,3), maximum must be positive, and minimum must not exceed maximum".to_owned(),
        ));
    }
    let now = chrono::Utc::now();
    Ok(JudgingCriterion {
        id,
        pageant_id,
        code,
        name,
        description: request.description,
        default_maximum_score: request.default_maximum_score,
        default_minimum_score: request.default_minimum_score,
        is_active: true,
        created_at: now,
        updated_at: now,
    })
}
