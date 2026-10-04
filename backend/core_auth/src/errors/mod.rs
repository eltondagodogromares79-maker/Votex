pub mod auth;

pub use auth::AuthError;

// Re-export shared types so the rest of core_auth only needs one import path.
pub use core_infra::errors::{AppError, RepositoryError};
