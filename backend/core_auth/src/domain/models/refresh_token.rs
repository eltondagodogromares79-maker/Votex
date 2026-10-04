use chrono::{DateTime, Utc};
use std::net::IpAddr;
use uuid::Uuid;

#[derive(Debug, Clone)]
pub struct UserRefreshToken {
    pub id: Uuid,
    pub user_id: Uuid,

    pub token_hash: String,

    pub issued_at: DateTime<Utc>,
    pub expires_at: DateTime<Utc>,

    pub revoked_at: Option<DateTime<Utc>>,

    pub replaced_by_token_id: Option<Uuid>,

    pub user_agent: Option<String>,
    pub ip_address: Option<IpAddr>,
}
