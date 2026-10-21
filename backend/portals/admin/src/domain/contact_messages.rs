use chrono::{DateTime, Utc};
use serde::Serialize;
use uuid::Uuid;

#[derive(Debug, Serialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct SubmittedContactMessage {
    pub id: Uuid,
    pub status: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct ContactMessage {
    pub id: Uuid,
    pub sender_user_id: Option<Uuid>,
    pub sender_name: String,
    pub sender_email: String,
    pub subject: String,
    pub message: String,
    pub status: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ContactMessagePage {
    pub items: Vec<ContactMessage>,
    pub limit: i64,
    pub offset: i64,
}
