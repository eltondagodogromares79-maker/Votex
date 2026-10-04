use serde::Deserialize;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct SubscribeRequest {
    pub plan_id: Uuid,
}
