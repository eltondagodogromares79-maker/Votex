pub mod api;
pub mod application;
pub mod config;
pub mod contracts;
pub mod db;
pub mod domain;
pub mod errors;
pub mod infrastructure;
pub mod middleware;
pub mod telemetry;
pub mod validation;

pub use errors::{AppError, ErrorResponse, RepositoryError};
pub use infrastructure::realtime::{PageantRealtimeEvent, RealtimeHub};
pub use middleware::RequestIdMiddleware;
pub use validation::validate;
