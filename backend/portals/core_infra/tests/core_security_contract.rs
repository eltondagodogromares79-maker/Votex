use core_infra::{
    application::ports::rate_limit_store::RateLimitStore,
    domain::{payments::CheckoutWebhookEvent, security::AuthenticatedUser},
    infrastructure::{in_memory_rate_limit_store::InMemoryRateLimitStore, realtime::RealtimeHub},
};
use std::time::{Duration, Instant};

#[test]
fn checkout_webhook_requires_event_type_and_resource_id() {
    let valid = br#"{"data":{"id":"evt_test","attributes":{"type":"checkout_session.payment.paid","data":{"id":"cs_test"}}}}"#;
    let event = CheckoutWebhookEvent::from_raw(valid).unwrap();
    assert_eq!(event.checkout_session_id, "cs_test");
    assert!(
        CheckoutWebhookEvent::from_raw(br#"{"data":{"attributes":{"type":"payment.paid"}}}"#)
            .is_err()
    );
}

#[test]
fn rate_limit_store_isolated_by_key_and_window() {
    let store = InMemoryRateLimitStore::default();
    let start = Instant::now();
    let window = Duration::from_secs(10);
    assert!(store.allow("key-a", 1, window, start));
    assert!(!store.allow("key-a", 1, window, start));
    assert!(store.allow("key-b", 1, window, start));
    assert!(store.allow("key-a", 1, window, start + window));
}

#[test]
fn websocket_tickets_are_one_time_use() {
    let hub = RealtimeHub::new();
    let ticket = hub.issue_ticket(AuthenticatedUser {
        user_id: uuid::Uuid::new_v4(),
        session_id: uuid::Uuid::new_v4(),
        role: "judge".into(),
    });
    assert!(hub.consume_ticket(ticket).is_some());
    assert!(hub.consume_ticket(ticket).is_none());
}
