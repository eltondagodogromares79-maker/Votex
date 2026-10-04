use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

use crate::domain::pageant_setup::{JudgingCriterion, PageantCategory};

#[derive(Debug, Deserialize, Validate)]
pub struct CategoryRequest {
    #[validate(length(min = 1, max = 80))]
    pub code: String,
    #[validate(length(min = 1, max = 150))]
    pub name: String,
    pub description: Option<String>,
    #[serde(default)]
    pub display_order: i32,
}

#[derive(Debug, Serialize)]
pub struct CategoryResponse {
    pub id: Uuid,
    pub pageant_id: Uuid,
    pub code: String,
    pub name: String,
    pub description: Option<String>,
    pub display_order: i32,
    pub is_active: bool,
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
            is_active: category.is_active,
            created_at: category.created_at,
            updated_at: category.updated_at,
        }
    }
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
