use std::sync::Arc;

use core_infra::AppError;
use rust_decimal::Decimal;
use uuid::Uuid;

use crate::{
    application::ports::pageant_setup_workflow::PageantSetupWorkflow,
    contracts::pageant_setup::{CategoryRequest, CriterionRequest},
    domain::pageant_setup::{
        JudgingCriterion, PageantCategory, RoundCategoryConfig, RoundCriterionConfig,
        RoundJudgingConfiguration,
    },
};

pub struct PageantSetupApplication {
    workflow: Arc<dyn PageantSetupWorkflow>,
}

impl PageantSetupApplication {
    pub fn new(workflow: Arc<dyn PageantSetupWorkflow>) -> Self {
        Self { workflow }
    }

    pub async fn get_leaderboard(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
        round_id: Uuid,
    ) -> Result<Vec<crate::domain::pageant_setup::LeaderboardEntry>, AppError> {
        self.workflow
            .get_leaderboard(coordinator_id, pageant_id, round_id)
            .await
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
        let eligibility_scope = validate_eligibility_scope(&request.eligibility_scope)?;
        let eligibility_notes = normalize_notes(request.eligibility_notes);
        if eligibility_scope == "CUSTOM" && eligibility_notes.is_none() {
            return Err(AppError::BadRequest(
                "eligibility details are required for custom eligibility".to_owned(),
            ));
        }
        if request.display_order < 0 {
            return Err(AppError::BadRequest(
                "display_order must not be negative".to_owned(),
            ));
        }
        let now = chrono::Utc::now();
        let round_id = request.round_id.ok_or_else(|| {
            AppError::BadRequest("round_id is required when creating a category".to_owned())
        })?;
        self.workflow
            .create_category(
                coordinator_id,
                Some(round_id),
                PageantCategory {
                    id: Uuid::new_v4(),
                    pageant_id,
                    code,
                    name,
                    description: request.description,
                    display_order: request.display_order,
                    eligibility_scope,
                    eligibility_notes,
                    is_active: true,
                    status: "DRAFT".to_owned(),
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
        let eligibility_scope = validate_eligibility_scope(&request.eligibility_scope)?;
        let eligibility_notes = normalize_notes(request.eligibility_notes);
        if eligibility_scope == "CUSTOM" && eligibility_notes.is_none() {
            return Err(AppError::BadRequest(
                "eligibility details are required for custom eligibility".to_owned(),
            ));
        }
        if request.display_order < 0 {
            return Err(AppError::BadRequest(
                "display_order must not be negative".to_owned(),
            ));
        }
        let current = self
            .workflow
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
                    eligibility_scope,
                    eligibility_notes,
                    is_active: true,
                    status: current.status,
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

    pub async fn activate_category(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
        category_id: Uuid,
    ) -> Result<(), AppError> {
        self.workflow
            .activate_category(coordinator_id, pageant_id, category_id)
            .await
    }

    pub async fn update_category_status(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
        category_id: Uuid,
        status: String,
    ) -> Result<String, AppError> {
        let status = status.trim().to_ascii_uppercase();
        if !matches!(status.as_str(), "DRAFT" | "OPEN" | "CLOSED" | "COMPLETED") {
            return Err(AppError::BadRequest(
                "category status must be DRAFT, OPEN, CLOSED, or COMPLETED".to_owned(),
            ));
        }
        let current = self
            .workflow
            .get_category(coordinator_id, pageant_id, category_id)
            .await?;
        let allowed = current.status == status
            || matches!(
                (current.status.as_str(), status.as_str()),
                ("DRAFT", "OPEN") | ("OPEN", "CLOSED") | ("CLOSED", "DRAFT" | "OPEN" | "COMPLETED")
            );
        if !allowed {
            return Err(AppError::Conflict(format!(
                "category status cannot change from {} to {}",
                current.status, status
            )));
        }
        if current.status == "COMPLETED" {
            return Err(AppError::Conflict(
                "completed categories are locked".to_owned(),
            ));
        }
        self.workflow
            .update_category_status(
                coordinator_id,
                pageant_id,
                category_id,
                current.status,
                status,
            )
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

    pub async fn activate_criterion(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
        criterion_id: Uuid,
    ) -> Result<(), AppError> {
        self.workflow
            .activate_criterion(coordinator_id, pageant_id, criterion_id)
            .await
    }

    pub async fn get_round_configuration(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
        round_id: Uuid,
    ) -> Result<RoundJudgingConfiguration, AppError> {
        self.workflow
            .get_round_configuration(coordinator_id, pageant_id, round_id)
            .await
    }

    pub async fn save_round_configuration(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
        round_id: Uuid,
        request: crate::contracts::pageant_setup::RoundJudgingConfigurationRequest,
    ) -> Result<RoundJudgingConfiguration, AppError> {
        let category_id_count = request.category_ids.len();
        let mut category_ids = request.category_ids;
        category_ids.sort_unstable();
        category_ids.dedup();
        if category_ids.len() != category_id_count {
            return Err(AppError::BadRequest(
                "category_ids must not contain duplicates".to_owned(),
            ));
        }
        let mut categories = Vec::with_capacity(request.categories.len());
        let mut category_weights = std::collections::HashSet::new();
        for item in request.categories {
            if !category_ids.contains(&item.category_id)
                || !category_weights.insert(item.category_id)
            {
                return Err(AppError::BadRequest(
                    "each selected category must have exactly one weight".to_owned(),
                ));
            }
            if item.weight_percentage < Decimal::ZERO
                || item.weight_percentage > Decimal::new(100, 0)
            {
                return Err(AppError::BadRequest(
                    "category weights must be from 0 to 100".to_owned(),
                ));
            }
            categories.push(RoundCategoryConfig {
                category_id: item.category_id,
                weight_percentage: item.weight_percentage,
            });
        }
        if categories.len() != category_ids.len() {
            return Err(AppError::BadRequest(
                "each selected category must have a weight".to_owned(),
            ));
        }
        let mut criteria = Vec::with_capacity(request.criteria.len());
        let mut pairs = std::collections::HashSet::new();
        let mut criteria_totals = std::collections::HashMap::<Uuid, Decimal>::new();
        for item in request.criteria {
            if !category_ids.contains(&item.category_id) {
                return Err(AppError::BadRequest(
                    "every criterion must belong to a category selected for this round".to_owned(),
                ));
            }
            if !pairs.insert((item.category_id, item.criterion_id)) {
                return Err(AppError::BadRequest(
                    "a criterion can only be assigned once per category in a round".to_owned(),
                ));
            }
            if item.weight_percentage <= Decimal::ZERO
                || item.weight_percentage > Decimal::new(100, 0)
                || item.maximum_score <= Decimal::ZERO
                || item.minimum_score < Decimal::ZERO
                || item.minimum_score > item.maximum_score
                || item.display_order < 0
            {
                return Err(AppError::BadRequest("criterion weights must be in (0, 100], scores must be valid, and display order cannot be negative".to_owned()));
            }
            *criteria_totals
                .entry(item.category_id)
                .or_insert(Decimal::ZERO) += item.weight_percentage;
            criteria.push(RoundCriterionConfig {
                criterion_id: item.criterion_id,
                category_id: item.category_id,
                weight_percentage: item.weight_percentage,
                maximum_score: item.maximum_score,
                minimum_score: item.minimum_score,
                display_order: item.display_order,
            });
        }
        if criteria_totals
            .values()
            .any(|total| *total != Decimal::new(100, 0))
        {
            return Err(AppError::BadRequest(
                "criteria points for each category must total exactly 100".to_owned(),
            ));
        }
        self.workflow
            .save_round_configuration(
                coordinator_id,
                pageant_id,
                round_id,
                RoundJudgingConfiguration {
                    category_ids,
                    categories,
                    criteria,
                },
            )
            .await
    }
}

fn normalize_notes(notes: Option<String>) -> Option<String> {
    notes.and_then(|value| {
        let trimmed = value.trim().to_owned();
        (!trimmed.is_empty()).then_some(trimmed)
    })
}

fn validate_eligibility_scope(scope: &str) -> Result<String, AppError> {
    let scope = scope.trim().to_ascii_uppercase();
    if !matches!(
        scope.as_str(),
        "OPEN" | "WOMEN" | "MEN" | "LGBTQ_PLUS" | "CUSTOM"
    ) {
        return Err(AppError::BadRequest(
            "eligibility_scope must be OPEN, WOMEN, MEN, LGBTQ_PLUS, or CUSTOM".to_owned(),
        ));
    }
    Ok(scope)
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

#[cfg(test)]
mod tests {
    use super::{
        PageantSetupApplication, normalize_notes, validate_code_name, validate_eligibility_scope,
    };
    use crate::{
        application::ports::pageant_setup_workflow::MockPageantSetupWorkflow,
        contracts::pageant_setup::{
            RoundCategoryConfigRequest, RoundCriterionConfigRequest,
            RoundJudgingConfigurationRequest,
        },
    };
    use rust_decimal::Decimal;
    use std::sync::Arc;
    use uuid::Uuid;

    #[test]
    fn normalizes_category_and_criterion_names_and_scope() {
        assert_eq!(
            validate_code_name(" gown_1 ", " Best in Gown ").unwrap(),
            ("GOWN_1".into(), "Best in Gown".into())
        );
        assert_eq!(validate_eligibility_scope(" women ").unwrap(), "WOMEN");
        assert_eq!(
            normalize_notes(Some("  participants  ".into())),
            Some("participants".into())
        );
        assert_eq!(normalize_notes(Some("  ".into())), None);
    }

    #[test]
    fn rejects_invalid_codes_names_and_eligibility_scopes() {
        assert!(validate_code_name("invalid-code", "A name").is_err());
        assert!(validate_code_name("CODE", " ").is_err());
        assert!(validate_eligibility_scope("everyone-ish").is_err());
    }

    fn configuration(
        weight: Decimal,
        criterion_weight: Decimal,
    ) -> RoundJudgingConfigurationRequest {
        let category_id = Uuid::new_v4();
        RoundJudgingConfigurationRequest {
            category_ids: vec![category_id],
            categories: vec![RoundCategoryConfigRequest {
                category_id,
                weight_percentage: weight,
            }],
            criteria: vec![RoundCriterionConfigRequest {
                criterion_id: Uuid::new_v4(),
                category_id,
                weight_percentage: criterion_weight,
                maximum_score: Decimal::new(100, 0),
                minimum_score: Decimal::ZERO,
                display_order: 0,
            }],
        }
    }

    #[tokio::test]
    async fn round_configuration_rejects_out_of_range_category_and_incomplete_criterion_weights() {
        let app = PageantSetupApplication::new(Arc::new(MockPageantSetupWorkflow::new()));
        let result = app
            .save_round_configuration(
                Uuid::new_v4(),
                Uuid::new_v4(),
                Uuid::new_v4(),
                configuration(Decimal::new(101, 0), Decimal::new(100, 0)),
            )
            .await;
        assert!(matches!(result, Err(core_infra::AppError::BadRequest(_))));

        let result = app
            .save_round_configuration(
                Uuid::new_v4(),
                Uuid::new_v4(),
                Uuid::new_v4(),
                configuration(Decimal::new(100, 0), Decimal::new(99, 0)),
            )
            .await;
        assert!(matches!(result, Err(core_infra::AppError::BadRequest(_))));
    }

    #[tokio::test]
    async fn round_configuration_rejects_duplicate_category_ids() {
        let app = PageantSetupApplication::new(Arc::new(MockPageantSetupWorkflow::new()));
        let mut config = configuration(Decimal::new(100, 0), Decimal::new(100, 0));
        config.category_ids.push(config.category_ids[0]);
        let result = app
            .save_round_configuration(Uuid::new_v4(), Uuid::new_v4(), Uuid::new_v4(), config)
            .await;
        assert!(matches!(result, Err(core_infra::AppError::BadRequest(_))));
    }
}
