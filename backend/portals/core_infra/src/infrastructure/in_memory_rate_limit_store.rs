use crate::application::ports::rate_limit_store::RateLimitStore;
use std::{
    collections::HashMap,
    sync::Mutex,
    time::{Duration, Instant},
};

#[derive(Clone, Copy)]
struct WindowEntry {
    started: Instant,
    count: u32,
}

#[derive(Default)]
pub struct InMemoryRateLimitStore {
    entries: Mutex<HashMap<String, WindowEntry>>,
}

impl RateLimitStore for InMemoryRateLimitStore {
    fn allow(&self, key: &str, max_requests: u32, window: Duration, now: Instant) -> bool {
        let Ok(mut entries) = self.entries.lock() else {
            return false;
        };
        entries.retain(|_, entry| now.duration_since(entry.started) < window);
        let entry = entries.entry(key.to_owned()).or_insert(WindowEntry {
            started: now,
            count: 0,
        });
        if now.duration_since(entry.started) >= window {
            *entry = WindowEntry {
                started: now,
                count: 0,
            };
        }
        if entry.count >= max_requests {
            false
        } else {
            entry.count += 1;
            true
        }
    }
}

#[cfg(test)]
mod tests {
    use super::InMemoryRateLimitStore;
    use crate::application::ports::rate_limit_store::RateLimitStore;
    use std::time::{Duration, Instant};

    #[test]
    fn enforces_limit_per_key_and_resets_after_window() {
        let store = InMemoryRateLimitStore::default();
        let start = Instant::now();
        let window = Duration::from_secs(30);
        assert!(store.allow("login:a", 2, window, start));
        assert!(store.allow("login:a", 2, window, start + Duration::from_secs(1)));
        assert!(!store.allow("login:a", 2, window, start + Duration::from_secs(2)));
        assert!(store.allow("login:b", 2, window, start + Duration::from_secs(2)));
        assert!(store.allow("login:a", 2, window, start + window));
    }

    #[test]
    fn zero_limit_rejects_every_request() {
        let store = InMemoryRateLimitStore::default();
        assert!(!store.allow("key", 0, Duration::from_secs(1), Instant::now()));
    }
}
