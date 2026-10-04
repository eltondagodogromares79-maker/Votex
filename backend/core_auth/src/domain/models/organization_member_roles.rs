use chrono::{DateTime, Utc};
use uuid::Uuid;

#[derive(Debug, Clone)]
pub struct OrganizationMemberRole {
    pub id: Uuid,
    pub organization_member_id: Uuid,
    pub role_id: Uuid,
    pub assigned_by: Option<Uuid>,
    pub created_at: DateTime<Utc>,
}
