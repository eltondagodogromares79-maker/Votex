use serde::Serialize;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize)]
pub struct Contestant {
    pub id: Uuid,
    pub pageant_id: Uuid,
    pub contestant_number: i32,
    pub first_name: String,
    pub middle_name: Option<String>,
    pub last_name: String,
    pub display_name: String,
    pub gender: Option<String>,
    pub photo_url: Option<String>,
    pub biography: Option<String>,
    pub is_active: bool,
}
