use std::{
    collections::HashMap,
    sync::Mutex,
    time::{Duration, Instant},
};

use crate::domain::security::AuthenticatedUser;
use serde::Serialize;
use tokio::sync::broadcast;
use uuid::Uuid;

const TICKET_TTL: Duration = Duration::from_secs(45);

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PageantRealtimeEvent {
    pub pageant_id: Uuid,
    pub event: String,
    pub occurred_at: chrono::DateTime<chrono::Utc>,
}

struct Ticket {
    user: AuthenticatedUser,
    expires_at: Instant,
}

/// Shared in-process realtime transport. The API server publishes after
/// successful pageant writes; subscribers are authorized before connecting.
pub struct RealtimeHub {
    tickets: Mutex<HashMap<Uuid, Ticket>>,
    events: broadcast::Sender<PageantRealtimeEvent>,
}

impl Default for RealtimeHub {
    fn default() -> Self {
        Self::new()
    }
}

impl RealtimeHub {
    pub fn new() -> Self {
        let (events, _) = broadcast::channel(512);
        Self {
            tickets: Mutex::new(HashMap::new()),
            events,
        }
    }

    pub fn issue_ticket(&self, user: AuthenticatedUser) -> Uuid {
        let now = Instant::now();
        let mut tickets = self
            .tickets
            .lock()
            .unwrap_or_else(|error| error.into_inner());
        tickets.retain(|_, ticket| ticket.expires_at > now);
        let id = Uuid::new_v4();
        tickets.insert(
            id,
            Ticket {
                user,
                expires_at: now + TICKET_TTL,
            },
        );
        id
    }

    /// Tickets are short-lived and single-use. They avoid putting the access
    /// token itself in a WebSocket URL, where it could be captured in logs.
    pub fn consume_ticket(&self, id: Uuid) -> Option<AuthenticatedUser> {
        let ticket = self
            .tickets
            .lock()
            .unwrap_or_else(|error| error.into_inner())
            .remove(&id)?;
        (ticket.expires_at > Instant::now()).then_some(ticket.user)
    }

    pub fn subscribe(&self) -> broadcast::Receiver<PageantRealtimeEvent> {
        self.events.subscribe()
    }

    pub fn publish_pageant(&self, pageant_id: Uuid, event: impl Into<String>) {
        let _ = self.events.send(PageantRealtimeEvent {
            pageant_id,
            event: event.into(),
            occurred_at: chrono::Utc::now(),
        });
    }
}

#[cfg(test)]
mod tests {
    use super::RealtimeHub;
    use crate::domain::security::AuthenticatedUser;
    use uuid::Uuid;

    fn user() -> AuthenticatedUser {
        AuthenticatedUser {
            user_id: Uuid::new_v4(),
            session_id: Uuid::new_v4(),
            role: "judge".into(),
        }
    }

    #[test]
    fn realtime_ticket_is_single_use_and_returns_original_user() {
        let hub = RealtimeHub::new();
        let expected = user();
        let ticket = hub.issue_ticket(expected.clone());
        assert_eq!(hub.consume_ticket(ticket), Some(expected));
        assert_eq!(hub.consume_ticket(ticket), None);
    }

    #[tokio::test]
    async fn publishing_delivers_pageant_scoped_event() {
        let hub = RealtimeHub::new();
        let mut receiver = hub.subscribe();
        let pageant_id = Uuid::new_v4();
        hub.publish_pageant(pageant_id, "scores.updated");
        let event = receiver.recv().await.unwrap();
        assert_eq!(event.pageant_id, pageant_id);
        assert_eq!(event.event, "scores.updated");
    }
}
