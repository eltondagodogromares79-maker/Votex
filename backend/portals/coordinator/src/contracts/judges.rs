use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

use crate::domain::judge::PageantJudge;

#[derive(Debug, Deserialize, Validate)]
pub struct AssignJudgeRequest {
    #[validate(email)]
    pub email: String,
    #[validate(length(min = 1, max = 100))]
    pub first_name: String,
    #[validate(length(min = 1, max = 100))]
    pub last_name: String,
    #[serde(default)]
    pub confirm_cross_organization_reuse: bool,
}

#[derive(Debug, Serialize)]
pub struct PageantJudgeResponse {
    pub pageant_id: Uuid,
    pub user_id: Uuid,
    pub role: &'static str,
    pub email: String,
    pub first_name: String,
    pub last_name: String,
    pub is_active: bool,
}

impl From<PageantJudge> for PageantJudgeResponse {
    fn from(judge: PageantJudge) -> Self {
        Self {
            pageant_id: judge.pageant_id,
            user_id: judge.user_id,
            role: judge.role.as_db_code(),
            email: judge.email,
            first_name: judge.first_name,
            last_name: judge.last_name,
            is_active: judge.is_active,
        }
    }
}
