use chrono::{DateTime, Utc};
use serde::Serialize;
use uuid::Uuid;
#[derive(Debug, Clone, Serialize)]
pub struct Advancement {
    pub id: Uuid,
    pub contestant_id: Uuid,
    pub contestant_number: i32,
    pub contestant_name: String,
    pub from_round_id: Uuid,
    pub from_round_name: String,
    pub to_round_id: Uuid,
    pub to_round_name: String,
    pub decision: String,
    pub reason: Option<String>,
    pub decided_by: Option<Uuid>,
    pub decided_at: DateTime<Utc>,
}
