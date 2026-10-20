use chrono::{NaiveDate, NaiveTime};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

use crate::domain::pageant::{AssignedPageant, PageantResourceLimits};

#[derive(Debug, Serialize)]
pub struct PageantResourceLimitsResponse {
    pub has_active_subscription: bool,
    pub max_judges_per_pageant: Option<i32>,
    pub max_tabulator_users: Option<i32>,
    pub max_rounds_per_pageant: Option<i32>,
    pub max_categories_per_round: Option<i32>,
    pub judges_used: i64,
    pub tabulators_used: i64,
    pub rounds_used: i64,
    pub categories_used: i64,
    pub round_categories: Vec<RoundCategoryUsageResponse>,
}

#[derive(Debug, Serialize)]
pub struct RoundCategoryUsageResponse {
    pub round_id: Uuid,
    pub round_name: String,
    pub categories_used: i64,
}

impl From<PageantResourceLimits> for PageantResourceLimitsResponse {
    fn from(limits: PageantResourceLimits) -> Self {
        Self {
            has_active_subscription: limits.has_active_subscription,
            max_judges_per_pageant: limits.max_judges_per_pageant,
            max_tabulator_users: limits.max_tabulator_users,
            max_rounds_per_pageant: limits.max_rounds_per_pageant,
            max_categories_per_round: limits.max_categories_per_round,
            judges_used: limits.judges_used,
            tabulators_used: limits.tabulators_used,
            rounds_used: limits.rounds_used,
            categories_used: limits.categories_used,
            round_categories: limits
                .round_categories
                .into_iter()
                .map(|usage| RoundCategoryUsageResponse {
                    round_id: usage.round_id,
                    round_name: usage.round_name,
                    categories_used: usage.categories_used,
                })
                .collect(),
        }
    }
}

#[derive(Debug, Deserialize, Validate)]
pub struct UpdateAssignedPageantRequest {
    #[validate(length(min = 1, max = 200))]
    pub name: String,
    #[validate(length(min = 3, max = 100))]
    pub slug: String,
    pub description: Option<String>,
    pub logo_url: Option<String>,
    pub event_date: Option<NaiveDate>,
    pub start_time: Option<NaiveTime>,
    pub end_time: Option<NaiveTime>,
    pub venue: Option<String>,
    pub is_public: bool,
}

#[derive(Debug, Serialize)]
pub struct AssignedPageantResponse {
    pub id: Uuid,
    pub organization_id: Uuid,
    pub organization_name: String,
    pub created_by: Uuid,
    pub name: String,
    pub slug: String,
    pub description: Option<String>,
    pub logo_url: Option<String>,
    pub event_date: Option<NaiveDate>,
    pub start_time: Option<NaiveTime>,
    pub end_time: Option<NaiveTime>,
    pub venue: Option<String>,
    pub status: String,
    pub is_public: bool,
}

impl From<AssignedPageant> for AssignedPageantResponse {
    fn from(pageant: AssignedPageant) -> Self {
        Self {
            id: pageant.id,
            organization_id: pageant.organization_id,
            organization_name: pageant.organization_name,
            created_by: pageant.created_by,
            name: pageant.name,
            slug: pageant.slug,
            description: pageant.description,
            logo_url: pageant.logo_url,
            event_date: pageant.event_date,
            start_time: pageant.start_time,
            end_time: pageant.end_time,
            venue: pageant.venue,
            status: pageant.status,
            is_public: pageant.is_public,
        }
    }
}
