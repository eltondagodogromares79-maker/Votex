use chrono::{DateTime, Utc};
use serde::Serialize;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct LegalPolicy {
    pub id: Uuid,
    pub slug: String,
    pub title: String,
    pub intro: String,
    pub body: String,
    pub version: i32,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LegalPolicyUpdate {
    pub title: String,
    pub intro: String,
    pub body: String,
}
