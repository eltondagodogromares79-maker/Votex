use std::error::Error;

use actix_web::{HttpResponse, ResponseError};
use thiserror::Error;
use tracing::error;
use validator::ValidationErrors;

use super::response::ErrorResponse;

#[derive(Debug, Error)]
pub enum AppError {
    // ── Authentication & Authorization ────────────────────────────────────────
    #[error("invalid credentials")]
    InvalidCredentials,

    #[error("unauthorized")]
    Unauthorized,

    #[error("forbidden")]
    Forbidden,

    #[error("token is invalid or has expired")]
    InvalidToken,

    #[error("email address has not been verified")]
    EmailNotVerified,

    #[error("account is not active")]
    AccountInactive,

    #[error("account is temporarily locked due to too many failed login attempts")]
    AccountLocked { retry_after_seconds: i64 },

    // ── Request Errors ────────────────────────────────────────────────────────
    #[error("bad request: {0}")]
    BadRequest(String),

    #[error("validation failed")]
    Validation(#[source] ValidationErrors),

    #[error("not found: {0}")]
    NotFound(String),

    #[error("conflict: {0}")]
    Conflict(String),

    #[error("email already exists")]
    EmailTaken,

    #[error("organization slug already taken")]
    SlugTaken,

    // ── Infrastructure Errors ────────────────────────────────────────────────
    #[error("database error")]
    Database(#[source] Box<dyn std::error::Error + Send + Sync>),

    #[error("external service error")]
    ExternalService(#[source] Box<dyn std::error::Error + Send + Sync>),

    #[error("configuration error: {0}")]
    Configuration(String),

    #[error("internal server error")]
    Internal,
}

impl AppError {
    // ─────────────────────────────────────────────────────────────────────────
    // Machine-readable error code
    // ─────────────────────────────────────────────────────────────────────────

    fn code(&self) -> &'static str {
        match self {
            AppError::InvalidCredentials => "INVALID_CREDENTIALS",
            AppError::Unauthorized => "UNAUTHORIZED",
            AppError::Forbidden => "FORBIDDEN",
            AppError::InvalidToken => "INVALID_TOKEN",
            AppError::EmailNotVerified => "EMAIL_NOT_VERIFIED",
            AppError::AccountInactive => "ACCOUNT_INACTIVE",
            AppError::AccountLocked { .. } => "ACCOUNT_LOCKED",

            AppError::BadRequest(_) => "BAD_REQUEST",
            AppError::Validation(_) => "VALIDATION_ERROR",
            AppError::NotFound(_) => "NOT_FOUND",
            AppError::Conflict(_) => "CONFLICT",
            AppError::EmailTaken => "EMAIL_TAKEN",
            AppError::SlugTaken => "SLUG_TAKEN",

            AppError::Database(_) => "INTERNAL_SERVER_ERROR",
            AppError::ExternalService(_) => "INTERNAL_SERVER_ERROR",
            AppError::Configuration(_) => "INTERNAL_SERVER_ERROR",
            AppError::Internal => "INTERNAL_SERVER_ERROR",
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Public message
    // ─────────────────────────────────────────────────────────────────────────

    fn public_message(&self) -> String {
        match self {
            AppError::InvalidCredentials => "Invalid email or password.".into(),

            AppError::Unauthorized => "Authentication is required.".into(),

            AppError::Forbidden => "You do not have permission to perform this action.".into(),

            AppError::InvalidToken => "The token is invalid or has expired.".into(),

            AppError::EmailNotVerified => {
                "Please verify your email address before continuing.".into()
            }

            AppError::AccountInactive => {
                "Your account is not active. Please contact support.".into()
            }

            AppError::AccountLocked { .. } => "Account temporarily locked.".into(),

            AppError::BadRequest(message) => message.clone(),

            AppError::Validation(_) => "One or more fields are invalid.".into(),

            AppError::NotFound(resource) => {
                format!("{resource} was not found.")
            }

            AppError::Conflict(message) => message.clone(),

            AppError::EmailTaken => "An account with this email already exists.".into(),

            AppError::SlugTaken => "This organization slug is already taken.".into(),

            AppError::Database(_)
            | AppError::ExternalService(_)
            | AppError::Configuration(_)
            | AppError::Internal => "An unexpected error occurred.".into(),
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Internal error detection
    // ─────────────────────────────────────────────────────────────────────────

    fn is_internal(&self) -> bool {
        matches!(
            self,
            AppError::Database(_)
                | AppError::ExternalService(_)
                | AppError::Configuration(_)
                | AppError::Internal
        )
    }
}

impl ResponseError for AppError {
    fn error_response(&self) -> HttpResponse {
        let status = self.status_code();

        // ─────────────────────────────────────────────────────────────────────
        // Internal errors
        // ─────────────────────────────────────────────────────────────────────

        if self.is_internal() {
            let (body, error_id) = ErrorResponse::internal();

            error!(
                error_id = %error_id,
                error_code = self.code(),
                error = %self,
                source = ?self.source(),
                "internal server error"
            );

            return HttpResponse::build(status).json(body);
        }

        // ─────────────────────────────────────────────────────────────────────
        // Validation errors
        // ─────────────────────────────────────────────────────────────────────

        if let AppError::Validation(validation_errors) = self {
            let body = serde_json::json!({
                "code": "VALIDATION_ERROR",
                "message": "One or more fields are invalid.",
                "fields": format_validation_errors(validation_errors),
            });

            return HttpResponse::UnprocessableEntity().json(body);
        }

        // ─────────────────────────────────────────────────────────────────────
        // Account lockout
        // ─────────────────────────────────────────────────────────────────────

        if let AppError::AccountLocked {
            retry_after_seconds,
        } = self
        {
            let retry_after_seconds = (*retry_after_seconds).max(0);

            let minutes = retry_after_seconds / 60;
            let seconds = retry_after_seconds % 60;

            let retry_after = format!("{minutes}:{seconds:02}");

            let message = format!(
                "Account temporarily locked. \
                 Too many failed login attempts. \
                 Please try again in {retry_after}."
            );

            let body = serde_json::json!({
                "code": "ACCOUNT_LOCKED",
                "message": message,
                "retry_after": retry_after,
                "retry_after_seconds": retry_after_seconds,
            });

            return HttpResponse::TooManyRequests().json(body);
        }

        // ─────────────────────────────────────────────────────────────────────
        // Standard errors
        // ─────────────────────────────────────────────────────────────────────

        HttpResponse::build(status).json(ErrorResponse::new(self.code(), self.public_message()))
    }

    fn status_code(&self) -> actix_web::http::StatusCode {
        use actix_web::http::StatusCode;

        match self {
            AppError::InvalidCredentials | AppError::Unauthorized | AppError::InvalidToken => {
                StatusCode::UNAUTHORIZED
            }

            AppError::Forbidden | AppError::EmailNotVerified | AppError::AccountInactive => {
                StatusCode::FORBIDDEN
            }

            AppError::AccountLocked { .. } => StatusCode::TOO_MANY_REQUESTS,

            AppError::BadRequest(_) => StatusCode::BAD_REQUEST,

            AppError::Validation(_) => StatusCode::UNPROCESSABLE_ENTITY,

            AppError::NotFound(_) => StatusCode::NOT_FOUND,

            AppError::Conflict(_) | AppError::EmailTaken | AppError::SlugTaken => {
                StatusCode::CONFLICT
            }

            AppError::Database(_)
            | AppError::ExternalService(_)
            | AppError::Configuration(_)
            | AppError::Internal => StatusCode::INTERNAL_SERVER_ERROR,
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Validation error formatting
// ─────────────────────────────────────────────────────────────────────────────

fn format_validation_errors(
    errors: &ValidationErrors,
) -> std::collections::HashMap<String, Vec<String>> {
    errors
        .field_errors()
        .iter()
        .map(|(field, errors)| {
            let messages = errors
                .iter()
                .map(|error| {
                    error
                        .message
                        .as_ref()
                        .map(|message| message.to_string())
                        .unwrap_or_else(|| error.code.to_string())
                })
                .collect();

            (field.to_string(), messages)
        })
        .collect()
}

impl From<ValidationErrors> for AppError {
    fn from(error: ValidationErrors) -> Self {
        AppError::Validation(error)
    }
}
