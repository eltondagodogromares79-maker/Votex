use chrono::{DateTime, Utc};
use serde::Serialize;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize)]
pub struct Round {
    pub id: Uuid,
    pub pageant_id: Uuid,
    pub name: String,
    pub round_number: i32,
    pub round_type: String,
    pub status: String,
    pub advancement_count: Option<i32>,
    pub starts_at: Option<DateTime<Utc>>,
    pub ends_at: Option<DateTime<Utc>>,
}
