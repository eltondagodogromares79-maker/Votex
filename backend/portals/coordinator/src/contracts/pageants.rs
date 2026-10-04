use chrono::{NaiveDate, NaiveTime};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

use crate::domain::pageant::AssignedPageant;

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
