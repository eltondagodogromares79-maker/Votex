use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Copy, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum RoundType {
    Preliminary,
    Swimwear,
    FormalWear,
    Talent,
    QuestionAndAnswer,
    Final,
    Custom,
}

impl RoundType {
    pub fn as_db_str(self) -> &'static str {
        match self {
            Self::Preliminary => "PRELIMINARY",
            Self::Swimwear => "SWIMWEAR",
            Self::FormalWear => "FORMAL_WEAR",
            Self::Talent => "TALENT",
            Self::QuestionAndAnswer => "QUESTION_AND_ANSWER",
            Self::Final => "FINAL",
            Self::Custom => "CUSTOM",
        }
    }
}

#[derive(Debug, Clone, Copy, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum RoundStatus {
    Draft,
    Open,
    Closed,
    Finalized,
}

impl RoundStatus {
    pub fn as_db_str(self) -> &'static str {
        match self {
            Self::Draft => "DRAFT",
            Self::Open => "OPEN",
            Self::Closed => "CLOSED",
            Self::Finalized => "FINALIZED",
        }
    }

    pub fn can_transition_to(self, next: Self) -> bool {
        self == next
            || matches!(
                (self, next),
                (Self::Draft, Self::Open)
                    | (Self::Open, Self::Closed)
                    | (Self::Closed, Self::Finalized)
            )
    }
}

#[derive(Debug, Clone)]
pub struct PageantRound {
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
