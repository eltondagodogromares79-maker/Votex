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
