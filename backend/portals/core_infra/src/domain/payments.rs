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
        // PayMongo webhook events put the event type and resource under
        // data.attributes.type and data.attributes.data. Keep the alternate
        // locations as fallbacks for older payload variants.
        let data = &value["data"];
        let attrs = &data["attributes"];
        let v2_resource = &data["data"];
        let resource = &attrs["data"];
        let event_id = data["id"]
            .as_str()
            .or_else(|| value["id"].as_str())
            .unwrap_or("checkout-event");
        let event_type = attrs["type"]
            .as_str()
            .or_else(|| data["type"].as_str())
            .unwrap_or_default();
        let session_id = resource["id"]
            .as_str()
            .or_else(|| v2_resource["id"].as_str())
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
            livemode: attrs["livemode"]
                .as_bool()
                .or_else(|| data["livemode"].as_bool())
                .unwrap_or(false),
        })
    }
}

#[cfg(test)]
mod tests {
    use super::CheckoutWebhookEvent;

    #[test]
    fn parses_checkout_session_webhook_envelope() {
        let raw = br#"{"data":{"id":"evt_1","attributes":{"type":"checkout_session.payment.paid","livemode":false,"data":{"id":"cs_1"}}}}"#;
        let event = CheckoutWebhookEvent::from_raw(raw).unwrap();
        assert_eq!(event.event_id, "evt_1");
        assert_eq!(event.event_type, "checkout_session.payment.paid");
        assert_eq!(event.checkout_session_id, "cs_1");
        assert!(!event.livemode);
    }

    #[test]
    fn rejects_malformed_and_incomplete_webhooks() {
        assert!(CheckoutWebhookEvent::from_raw(b"not json").is_err());
        assert!(
            CheckoutWebhookEvent::from_raw(br#"{"data":{"attributes":{"type":"payment.paid"}}}"#)
                .is_err()
        );
    }
}
