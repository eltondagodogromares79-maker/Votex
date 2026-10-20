use chrono::{DateTime, Utc};
use uuid::Uuid;

#[derive(Debug, Clone)]
pub struct Contestant {
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

#[derive(Debug, Clone, Default)]
pub struct ContestantPlacements {
    pub category_ids: Vec<Uuid>,
    pub round_ids: Vec<Uuid>,
}
