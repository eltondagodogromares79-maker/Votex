use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum UserAccountStatus {
    Pending,
    Active,
    Suspended,
    Deactivated,
}

impl UserAccountStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            UserAccountStatus::Pending => "PENDING",
            UserAccountStatus::Active => "ACTIVE",
            UserAccountStatus::Suspended => "SUSPENDED",
            UserAccountStatus::Deactivated => "DEACTIVATED",
        }
    }

    pub fn from_str(s: &str) -> Self {
        match s {
            "ACTIVE" => UserAccountStatus::Active,
            "SUSPENDED" => UserAccountStatus::Suspended,
            "DEACTIVATED" => UserAccountStatus::Deactivated,
            _ => UserAccountStatus::Pending,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: Uuid,
    pub email: String,
    pub password_hash: Option<String>,
    pub first_name: String,
    pub middle_name: Option<String>,
    pub last_name: String,
    pub phone: Option<String>,
    pub profile_image_url: Option<String>,
    pub status: UserAccountStatus,
    pub email_verified_at: Option<DateTime<Utc>>,
    pub last_login_at: Option<DateTime<Utc>>,
    pub failed_login_attempts: i32,
    pub failed_login_window_started_at: Option<DateTime<Utc>>,
    pub locked_until: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}
