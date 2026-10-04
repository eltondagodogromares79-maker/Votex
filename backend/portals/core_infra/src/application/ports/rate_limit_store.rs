use std::time::{Duration, Instant};

pub trait RateLimitStore: Send + Sync {
    fn allow(&self, key: &str, max_requests: u32, window: Duration, now: Instant) -> bool;
}
