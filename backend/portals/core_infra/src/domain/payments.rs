#[derive(Debug, Clone)]
pub struct CheckoutRequest {
    pub idempotency_key: String,
    pub reference_number: String,
    pub item_name: String,
    pub description: String,
    pub amount_minor: i64,
    pub currency: String,
}

#[derive(Debug, Clone)]
pub struct CheckoutSession {
    pub id: String,
    pub checkout_url: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CheckoutWebhookEvent {
    pub event_id: String,
    pub event_type: String,
    pub checkout_session_id: String,
    pub livemode: bool,
}

impl CheckoutWebhookEvent {
    pub fn from_raw(raw: &[u8]) -> Result<Self, crate::AppError> {
        let value: serde_json::Value = serde_json::from_slice(raw)
            .map_err(|_| crate::AppError::BadRequest("invalid PayMongo webhook payload".into()))?;
        // Checkout API v2 wraps the event at data, then its resource at data.data.
        // Retain the older event envelope as a fallback for existing integrations.
        let data = &value["data"];
        let attrs = &data["attributes"];
        let v2_resource = &data["data"];
        let legacy_resource = &attrs["data"];
        let event_id = data["id"]
            .as_str()
            .or_else(|| value["id"].as_str())
            .unwrap_or("checkout-event");
        let event_type = data["type"]
            .as_str()
            .or_else(|| attrs["type"].as_str())
            .unwrap_or_default();
        let session_id = v2_resource["id"]
            .as_str()
            .or_else(|| legacy_resource["id"].as_str())
            .unwrap_or_default();
        if session_id.is_empty() || event_type.is_empty() {
            return Err(crate::AppError::BadRequest(
                "incomplete PayMongo webhook payload".into(),
            ));
        }
        Ok(Self {
            event_id: event_id.to_owned(),
            event_type: event_type.to_owned(),
            checkout_session_id: session_id.to_owned(),
            livemode: data["livemode"]
                .as_bool()
                .or_else(|| attrs["livemode"].as_bool())
                .unwrap_or(false),
        })
    }
}
