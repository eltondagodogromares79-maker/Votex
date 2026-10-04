use thiserror::Error;

use core_infra::errors::{AppError, RepositoryError};

/// Authentication and registration domain errors.
///
/// These are internal to `core_auth`. They convert into `AppError` at the
/// application-service boundary so handlers only ever see `AppError`.
#[derive(Debug, Error)]
pub enum AuthError {
    // ── Registration ──────────────────────────────────────────────────────────
    #[error("email already exists")]
    EmailTaken,

    #[error("organization slug already taken")]
    SlugTaken,

    // ── Login ─────────────────────────────────────────────────────────────────
    /// User not found during login. Converts to `InvalidCredentials` — never
    /// reveal to the client whether the email exists.
    #[error("user not found")]
    UserNotFound,

    #[error("incorrect password")]
    WrongPassword,

    #[error("account is not active")]
    AccountInactive,

    #[error("email not verified")]
    EmailNotVerified,

    // ── Token ─────────────────────────────────────────────────────────────────
    #[error("token is invalid or expired")]
    InvalidToken,

    #[error("token has been revoked")]
    TokenRevoked,

    // ── Infrastructure ────────────────────────────────────────────────────────
    #[error("repository error: {0}")]
    Repository(#[from] RepositoryError),
}

impl From<AuthError> for AppError {
    fn from(e: AuthError) -> Self {
        match e {
            AuthError::EmailTaken => AppError::EmailTaken,
            AuthError::SlugTaken => AppError::SlugTaken,

            // SECURITY: UserNotFound and WrongPassword both become
            // InvalidCredentials — the client cannot distinguish them.
            AuthError::UserNotFound | AuthError::WrongPassword => AppError::InvalidCredentials,

            AuthError::AccountInactive => AppError::AccountInactive,
            AuthError::EmailNotVerified => AppError::EmailNotVerified,
            AuthError::InvalidToken | AuthError::TokenRevoked => AppError::InvalidToken,

            AuthError::Repository(repo_err) => match repo_err {
                RepositoryError::NotFound => AppError::InvalidCredentials,
                RepositoryError::UniqueViolation { constraint } => {
                    if constraint.contains("email") {
                        AppError::EmailTaken
                    } else if constraint.contains("slug") {
                        AppError::SlugTaken
                    } else {
                        AppError::Conflict(format!("constraint violated: {constraint}"))
                    }
                }
                RepositoryError::ForeignKeyViolation { constraint } => {
                    AppError::Conflict(format!("related resource not found: {constraint}"))
                }
                RepositoryError::Database(source) => AppError::Database(source),
                RepositoryError::Connection(source) => AppError::Database(source),
            },
        }
    }
}
