use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

use crate::domain::pageant_setup::{
    JudgingCriterion, LeaderboardEntry, PageantCategory, RoundJudgingConfiguration,
};

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LeaderboardEntryResponse {
    pub contestant_id: Uuid,
    pub contestant_number: i32,
    pub contestant_name: String,
    pub gender: Option<String>,
    pub photo_url: Option<String>,
    pub category_id: Option<Uuid>,
    pub category_name: Option<String>,
    pub eligibility_scope: Option<String>,
    pub category_weight: Option<Decimal>,
    pub score: Option<Decimal>,
    pub submitted_judges: i64,
}

impl From<LeaderboardEntry> for LeaderboardEntryResponse {
    fn from(value: LeaderboardEntry) -> Self {
        Self {
            contestant_id: value.contestant_id,
            contestant_number: value.contestant_number,
            contestant_name: value.contestant_name,
            gender: value.gender,
            photo_url: value.photo_url,
            category_id: value.category_id,
            category_name: value.category_name,
            eligibility_scope: value.eligibility_scope,
            category_weight: value.category_weight,
            score: value.score,
            submitted_judges: value.submitted_judges,
        }
    }
}

#[derive(Debug, Deserialize, Validate)]
pub struct CategoryRequest {
    #[validate(length(min = 1, max = 80))]
    pub code: String,
    #[validate(length(min = 1, max = 150))]
    pub name: String,
    pub description: Option<String>,
    #[serde(default)]
    pub display_order: i32,
    #[serde(default = "default_eligibility_scope")]
    pub eligibility_scope: String,
    pub eligibility_notes: Option<String>,
    pub round_id: Option<Uuid>,
}

fn default_eligibility_scope() -> String {
    "OPEN".to_owned()
}

#[derive(Debug, Serialize)]
pub struct CategoryResponse {
    pub id: Uuid,
    pub pageant_id: Uuid,
    pub code: String,
    pub name: String,
    pub description: Option<String>,
    pub display_order: i32,
    pub eligibility_scope: String,
    pub eligibility_notes: Option<String>,
    pub is_active: bool,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl From<PageantCategory> for CategoryResponse {
    fn from(category: PageantCategory) -> Self {
        Self {
            id: category.id,
            pageant_id: category.pageant_id,
            code: category.code,
            name: category.name,
            description: category.description,
            display_order: category.display_order,
            eligibility_scope: category.eligibility_scope,
            eligibility_notes: category.eligibility_notes,
            is_active: category.is_active,
            status: category.status,
            created_at: category.created_at,
            updated_at: category.updated_at,
        }
    }
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CategoryStatusRequest {
    pub status: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CategoryStatusResponse {
    pub status: String,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CriterionRequest {
    #[validate(length(min = 1, max = 80))]
    pub code: String,
    #[validate(length(min = 1, max = 150))]
    pub name: String,
    pub description: Option<String>,
    pub default_maximum_score: Decimal,
    pub default_minimum_score: Decimal,
}

#[derive(Debug, Serialize)]
pub struct CriterionResponse {
    pub id: Uuid,
    pub pageant_id: Uuid,
    pub code: String,
    pub name: String,
    pub description: Option<String>,
    pub default_maximum_score: Decimal,
    pub default_minimum_score: Decimal,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct RoundCategoryConfigRequest {
    pub category_id: Uuid,
    pub weight_percentage: Decimal,
}

#[derive(Debug, Deserialize, Validate)]
pub struct RoundCriterionConfigRequest {
    pub criterion_id: Uuid,
    pub category_id: Uuid,
    pub weight_percentage: Decimal,
    pub maximum_score: Decimal,
    pub minimum_score: Decimal,
    #[serde(default)]
    pub display_order: i32,
}

#[derive(Debug, Deserialize, Validate)]
pub struct RoundJudgingConfigurationRequest {
    #[serde(default)]
    pub category_ids: Vec<Uuid>,
    #[serde(default)]
    pub categories: Vec<RoundCategoryConfigRequest>,
    #[serde(default)]
    pub criteria: Vec<RoundCriterionConfigRequest>,
}

#[derive(Debug, Serialize)]
pub struct RoundCriterionConfigResponse {
    pub criterion_id: Uuid,
    pub category_id: Uuid,
    pub weight_percentage: Decimal,
    pub maximum_score: Decimal,
    pub minimum_score: Decimal,
    pub display_order: i32,
}

#[derive(Debug, Serialize)]
pub struct RoundCategoryConfigResponse {
    pub category_id: Uuid,
    pub weight_percentage: Decimal,
}

#[derive(Debug, Serialize)]
pub struct RoundJudgingConfigurationResponse {
    pub category_ids: Vec<Uuid>,
    pub categories: Vec<RoundCategoryConfigResponse>,
    pub criteria: Vec<RoundCriterionConfigResponse>,
}

impl From<RoundJudgingConfiguration> for RoundJudgingConfigurationResponse {
    fn from(value: RoundJudgingConfiguration) -> Self {
        Self {
            category_ids: value.category_ids,
            categories: value
                .categories
                .into_iter()
                .map(|item| RoundCategoryConfigResponse {
                    category_id: item.category_id,
                    weight_percentage: item.weight_percentage,
                })
                .collect(),
            criteria: value
                .criteria
                .into_iter()
                .map(|item| RoundCriterionConfigResponse {
                    criterion_id: item.criterion_id,
                    category_id: item.category_id,
                    weight_percentage: item.weight_percentage,
                    maximum_score: item.maximum_score,
                    minimum_score: item.minimum_score,
                    display_order: item.display_order,
                })
                .collect(),
        }
    }
}

impl From<JudgingCriterion> for CriterionResponse {
    fn from(criterion: JudgingCriterion) -> Self {
        Self {
            id: criterion.id,
            pageant_id: criterion.pageant_id,
            code: criterion.code,
            name: criterion.name,
            description: criterion.description,
            default_maximum_score: criterion.default_maximum_score,
            default_minimum_score: criterion.default_minimum_score,
            is_active: criterion.is_active,
            created_at: criterion.created_at,
            updated_at: criterion.updated_at,
        }
    }
}
