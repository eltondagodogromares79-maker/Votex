use serde::{Deserialize, Serialize};
use validator::Validate;

use crate::domain::models::{auth_session::AuthSession, user::User};

// ─── Login request ────────────────────────────────────────────────────────────

/// POST /api/v1/auth/login
#[derive(Debug, Deserialize, Validate)]
pub struct LoginRequest {
    #[validate(email(message = "must be a valid email address"))]
    pub email: String,

    pub password: String,
}

// ─── Internal login result (not serialised directly) ─────────────────────────

/// Internal result from AuthenticationApplication::login.
/// The refresh token is kept here so the HTTP handler can place it
/// into an HttpOnly cookie — it must NOT appear in the JSON body.
#[derive(Debug, Serialize, Deserialize)]
pub struct LoginResult {
    pub access_token: String,
    pub token_type: String,
    pub expires_in: i64,
    /// Raw refresh token — goes into HttpOnly cookie, never JSON body.
    pub refresh_token: String,
}

// ─── HTTP login response ──────────────────────────────────────────────────────

/// JSON body returned by POST /api/v1/auth/login.
///
/// Contains only session bootstrap information.
/// Identity (user_id, role, name, email) is obtained from GET /api/v1/auth/me
/// using the access token issued here.
///
/// The refresh token is NOT included — it travels as an HttpOnly cookie only.
#[derive(Debug, Serialize, Deserialize)]
pub struct LoginResponse {
    pub access_token: String,
    pub token_type: String,
    pub expires_in: i64,
}

// ─── Refresh token ────────────────────────────────────────────────────────────

/// Browser flow: refresh token comes from the HttpOnly cookie, not the body.
#[derive(Debug, Deserialize)]
pub struct RefreshTokenRequest {
    pub refresh_token: String,
}

/// JSON body returned by POST /api/v1/auth/refresh.
#[derive(Debug, Serialize, Deserialize)]
pub struct RefreshTokenResponse {
    pub access_token: String,
    pub token_type: String,
    pub expires_in: i64,
}

/// Internal result from RefreshTokenApplication::refresh.
/// Wraps the full User and session so the application layer can re-issue
/// a token with the current role without a second DB round-trip.
#[derive(Debug, Serialize, Deserialize)]
pub struct RefreshSessionResult {
    pub user: User,
    pub session: AuthSession,
    pub refresh_token: String,
}

// ─── Logout ───────────────────────────────────────────────────────────────────

/// Browser flow: refresh token comes from the HttpOnly cookie, not the body.
#[derive(Debug, Deserialize)]
pub struct LogoutRequest {
    pub refresh_token: String,
}

/// Generic success response for logout endpoints.
#[derive(Debug, Serialize, Deserialize)]
pub struct LogoutResponse {
    pub message: String,
}
