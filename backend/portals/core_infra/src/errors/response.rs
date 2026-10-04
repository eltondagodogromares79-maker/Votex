use serde::Serialize;
use uuid::Uuid;

/// The single JSON shape returned for every API error.
///
/// Success responses are free-form; error responses always look like this:
///
/// ```json
/// { "code": "VALIDATION_ERROR", "message": "...", "error_id": null }
/// { "code": "INTERNAL_SERVER_ERROR", "message": "An unexpected error occurred", "error_id": "uuid" }
/// ```
#[derive(Debug, Serialize)]
pub struct ErrorResponse {
    /// Machine-readable error code. Clients switch on this.
    pub code: &'static str,
    /// Human-readable message safe to display. Never contains internals.
    pub message: String,
    /// Present only for unexpected internal errors so ops can correlate logs.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error_id: Option<Uuid>,
}

impl ErrorResponse {
    pub fn new(code: &'static str, message: impl Into<String>) -> Self {
        Self {
            code,
            message: message.into(),
            error_id: None,
        }
    }

    pub fn internal() -> (Self, Uuid) {
        let id = Uuid::new_v4();
        (
            Self {
                code: "INTERNAL_SERVER_ERROR",
                message: "An unexpected error occurred".into(),
                error_id: Some(id),
            },
            id,
        )
    }
}
