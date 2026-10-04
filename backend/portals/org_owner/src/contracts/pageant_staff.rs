use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

use crate::domain::pageant_staff::{PageantStaffMember, PageantStaffRole};

#[derive(Debug, Deserialize, Validate)]
pub struct AssignPageantStaffRequest {
    #[validate(email)]
    pub email: String,
    #[serde(default)]
    #[validate(length(min = 1, max = 100))]
    pub first_name: Option<String>,
    #[serde(default)]
    #[validate(length(min = 1, max = 100))]
    pub last_name: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct PageantStaffResponse {
    pub user_id: Uuid,
    pub email: String,
    pub first_name: String,
    pub last_name: String,
    pub role: &'static str,
    pub is_active: bool,
}

impl From<PageantStaffMember> for PageantStaffResponse {
    fn from(member: PageantStaffMember) -> Self {
        let role = match member.role {
            PageantStaffRole::Coordinator => "PAGEANT_COORDINATOR",
            PageantStaffRole::Judge => "PAGEANT_JUDGE",
            PageantStaffRole::Tabulator => "PAGEANT_TABULATOR",
        };
        Self {
            user_id: member.user_id,
            email: member.email,
            first_name: member.first_name,
            last_name: member.last_name,
            role,
            is_active: member.is_active,
        }
    }
}
