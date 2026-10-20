use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

use crate::domain::contestant::Contestant;

#[derive(Debug, Deserialize, Validate)]
pub struct ContestantRequest {
    #[validate(range(min = 1))]
    pub contestant_number: i32,
    #[validate(length(min = 1, max = 100))]
    pub first_name: String,
    #[validate(length(max = 100))]
    pub middle_name: Option<String>,
    #[validate(length(min = 1, max = 100))]
    pub last_name: String,
    #[validate(length(max = 250))]
    pub display_name: Option<String>,
    #[validate(length(max = 50))]
    pub gender: Option<String>,
    pub photo_url: Option<String>,
    pub biography: Option<String>,
    pub user_id: Option<Uuid>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct ContestantPlacementsRequest {
    #[serde(default)]
    pub category_ids: Vec<Uuid>,
    #[serde(default)]
    pub round_ids: Vec<Uuid>,
}

#[derive(Debug, Serialize)]
pub struct ContestantPlacementsResponse {
    pub category_ids: Vec<Uuid>,
    pub round_ids: Vec<Uuid>,
}

impl From<crate::domain::contestant::ContestantPlacements> for ContestantPlacementsResponse {
    fn from(value: crate::domain::contestant::ContestantPlacements) -> Self {
        Self {
            category_ids: value.category_ids,
            round_ids: value.round_ids,
        }
    }
}

#[derive(Debug, Serialize)]
pub struct ContestantResponse {
    pub id: Uuid,
    pub pageant_id: Uuid,
    pub user_id: Option<Uuid>,
    pub contestant_number: i32,
    pub first_name: String,
    pub middle_name: Option<String>,
    pub last_name: String,
    pub display_name: String,
    pub gender: Option<String>,
    pub photo_url: Option<String>,
    pub biography: Option<String>,
    pub is_active: bool,
    pub current_round_status: Option<String>,
    pub current_round_name: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl From<Contestant> for ContestantResponse {
    fn from(contestant: Contestant) -> Self {
        Self {
            id: contestant.id,
            pageant_id: contestant.pageant_id,
            user_id: contestant.user_id,
            contestant_number: contestant.contestant_number,
            first_name: contestant.first_name,
            middle_name: contestant.middle_name,
            last_name: contestant.last_name,
            display_name: contestant.display_name,
            gender: contestant.gender,
            photo_url: contestant.photo_url,
            biography: contestant.biography,
            is_active: contestant.is_active,
            current_round_status: contestant.current_round_status,
            current_round_name: contestant.current_round_name,
            created_at: contestant.created_at,
            updated_at: contestant.updated_at,
        }
    }
}
