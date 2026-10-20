use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

#[derive(Debug, Deserialize, Validate)]
pub struct UpdateProfileRequest {
    #[validate(length(min = 1, max = 100))]
    pub first_name: String,
    #[validate(length(max = 100))]
    pub middle_name: Option<String>,
    #[validate(length(min = 1, max = 100))]
    pub last_name: String,
    #[validate(length(max = 30))]
    pub phone: Option<String>,
    #[validate(url)]
    pub profile_image_url: Option<String>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct RequestEmailChange {
    #[validate(email)]
    pub email: String,
}

#[derive(Debug, Deserialize, Validate)]
pub struct DeleteAccountRequest {
    #[validate(length(min = 1, max = 256))]
    pub current_password: String,
    #[validate(length(min = 1, max = 10))]
    pub confirmation: String,
}

/// Response for GET /api/v1/auth/me and PUT /api/v1/auth/me.
///
/// `role` — primary role from the JWT `rol` claim.
/// `organization_id` — the organization the user belongs to.
///   Populated for org_owner and coordinator roles.
///   Null for admin, judge, tabulator, audience.
#[derive(Debug, Serialize)]
pub struct ProfileResponse {
    pub user_id: Uuid,
    pub email: String,
    pub pending_email: Option<String>,
    pub email_verified_at: Option<chrono::DateTime<chrono::Utc>>,
    pub first_name: String,
    pub middle_name: Option<String>,
    pub last_name: String,
    pub phone: Option<String>,
    pub profile_image_url: Option<String>,
    pub must_change_password: bool,
    pub role: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub organization_id: Option<Uuid>,
}
