use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

use crate::domain::round::{PageantRound, RoundStatus, RoundType};

#[derive(Debug, Deserialize, Validate)]
pub struct CreateRoundRequest {
    #[validate(length(min = 1, max = 150))]
    pub name: String,
    #[validate(range(min = 1))]
    pub round_number: i32,
    pub round_type: RoundType,
    pub advancement_count: Option<i32>,
    pub starts_at: Option<DateTime<Utc>>,
    pub ends_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct UpdateRoundRequest {
    #[validate(length(min = 1, max = 150))]
    pub name: String,
    #[validate(range(min = 1))]
    pub round_number: i32,
    pub round_type: RoundType,
    pub status: RoundStatus,
    pub advancement_count: Option<i32>,
    pub starts_at: Option<DateTime<Utc>>,
    pub ends_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize)]
pub struct RoundResponse {
    pub id: Uuid,
    pub pageant_id: Uuid,
    pub name: String,
    pub round_number: i32,
    pub round_type: RoundType,
    pub status: RoundStatus,
    pub advancement_count: Option<i32>,
    pub starts_at: Option<DateTime<Utc>>,
    pub ends_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl From<PageantRound> for RoundResponse {
    fn from(round: PageantRound) -> Self {
        Self {
            id: round.id,
            pageant_id: round.pageant_id,
            name: round.name,
            round_number: round.round_number,
            round_type: round.round_type,
            status: round.status,
            advancement_count: round.advancement_count,
            starts_at: round.starts_at,
            ends_at: round.ends_at,
            created_at: round.created_at,
            updated_at: round.updated_at,
        }
    }
}
