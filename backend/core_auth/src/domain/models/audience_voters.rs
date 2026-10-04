use chrono::{DateTime, Utc};
use uuid::Uuid;

#[derive(Debug, Clone)]
pub struct AudienceVoter {
    pub id: Uuid,
    pub user_id: Uuid,
    pub voter_identity_hash: String,
    pub verification_status: String,
    pub created_at: DateTime<Utc>,
}
