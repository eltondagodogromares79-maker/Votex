use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

#[derive(Debug, Clone, Serialize)]
pub struct OrganizationProfile {
    pub id: Uuid,
    pub name: String,
    pub slug: String,
    pub description: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub address: Option<String>,
    pub logo_url: Option<String>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct UpdateOrganizationProfile {
    #[validate(length(min = 1, max = 200))]
    pub name: String,
    #[validate(length(min = 1, max = 100))]
    pub slug: String,
    #[validate(length(max = 5000))]
    pub description: Option<String>,
    #[validate(email)]
    pub email: Option<String>,
    #[validate(length(max = 30))]
    pub phone: Option<String>,
    #[validate(length(max = 2000))]
    pub address: Option<String>,
    pub logo_url: Option<String>,
}
