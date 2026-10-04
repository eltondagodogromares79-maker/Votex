use chrono::{NaiveDate, NaiveTime};
use uuid::Uuid;

#[derive(Debug, Clone)]
pub struct Pageant {
    pub id: Uuid,
    pub organization_id: Uuid,
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
