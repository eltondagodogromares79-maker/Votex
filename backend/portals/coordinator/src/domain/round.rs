use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Copy, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum RoundStatus {
    Draft,
    Open,
    Closed,
    Finalized,
}

impl Default for RoundStatus {
    fn default() -> Self {
        Self::Draft
    }
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

#[cfg(test)]
mod tests {
    use super::RoundStatus;

    #[test]
    fn status_serialization_and_database_values_are_stable() {
        assert_eq!(RoundStatus::Draft.as_db_str(), "DRAFT");
        assert_eq!(RoundStatus::Open.as_db_str(), "OPEN");
        assert_eq!(
            serde_json::to_string(&RoundStatus::Finalized).unwrap(),
            "\"FINALIZED\""
        );
    }

    #[test]
    fn only_forward_round_lifecycle_transitions_are_allowed() {
        assert!(RoundStatus::Draft.can_transition_to(RoundStatus::Open));
        assert!(RoundStatus::Open.can_transition_to(RoundStatus::Closed));
        assert!(RoundStatus::Closed.can_transition_to(RoundStatus::Finalized));
        assert!(!RoundStatus::Open.can_transition_to(RoundStatus::Draft));
        assert!(!RoundStatus::Finalized.can_transition_to(RoundStatus::Open));
    }
}

#[derive(Debug, Clone)]
pub struct PageantRound {
    pub id: Uuid,
    pub pageant_id: Uuid,
    pub name: String,
    pub round_number: i32,
    pub round_type: String,
    pub status: RoundStatus,
    pub advancement_count: Option<i32>,
    pub starts_at: Option<DateTime<Utc>>,
    pub ends_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}
