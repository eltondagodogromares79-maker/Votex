use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

/// ============================================================================
/// REGISTRATION REQUESTS
/// ============================================================================

/// Request body for registering a new organization owner.
///
/// Endpoint: `POST /api/v1/auth/register/org-owner`.
///
/// This request creates the following records as one business operation:
///
/// - User
/// - Organization
/// - OrganizationMember
/// - OrganizationMemberRole (ORG_OWNER)
/// - UserEmailVerificationToken
///
/// The request intentionally does NOT accept internal identifiers such as:
/// - user_id
/// - organization_id
/// - owner_id
/// - role_id
///
/// Those values are generated or resolved by the backend.
#[derive(Debug, Deserialize, Validate)]
pub struct RegisterOrgOwnerRequest {
    // ------------------------------------------------------------------------
    // USER / ACCOUNT INFORMATION
    // ------------------------------------------------------------------------
    /// Login email address for the new user account.
    ///
    /// The database also enforces uniqueness through the users.email
    /// unique constraint.
    #[validate(email(message = "must be a valid email address"))]
    pub email: String,

    /// Password for the new user account.
    ///
    /// Basic length validation happens here.
    /// Password complexity rules are enforced in the application/service layer.
    ///
    /// Requirements:
    /// - minimum: 8 characters
    /// - maximum: 128 characters
    #[validate(length(min = 8, max = 128, message = "must be between 8 and 128 characters"))]
    pub password: String,

    pub confirm_password: String,

    /// User's first name.
    #[validate(length(min = 1, max = 100, message = "must be between 1 and 100 characters"))]
    pub first_name: String,

    /// User's middle name.
    ///
    /// This field is optional because not every user has a middle name.
    #[validate(length(max = 100, message = "must be at most 100 characters"))]
    pub middle_name: Option<String>,

    /// User's last name.
    #[validate(length(min = 1, max = 100, message = "must be between 1 and 100 characters"))]
    pub last_name: String,

    /// User's optional phone number.
    ///
    /// Phone verification is not part of registration at this stage.
    #[validate(length(max = 30, message = "must be at most 30 characters"))]
    pub phone: Option<String>,

    // ------------------------------------------------------------------------
    // ORGANIZATION INFORMATION
    // ------------------------------------------------------------------------
    /// Display name of the organization.
    ///
    /// This becomes organizations.name.
    #[validate(length(min = 2, max = 200, message = "must be between 2 and 200 characters"))]
    pub org_name: String,

    /// Public URL-friendly identifier for the organization.
    ///
    /// Examples:
    /// - my-org
    /// - miss-cebu-2026
    /// - abc-pageants
    ///
    /// The database stores this in the organizations.slug column,
    /// which is case-insensitive because the column uses CITEXT.
    ///
    /// The API intentionally requires the submitted value to use:
    /// - lowercase letters
    /// - digits
    /// - hyphens
    ///
    /// This keeps generated URLs predictable.
    #[validate(
        length(
            min = 2,
            max = 80,
            message = "must be between 2 and 80 characters"
        ),
        regex(
            path = *SLUG_REGEX,
            message = "must contain only lowercase letters, digits, and hyphens"
        )
    )]
    pub org_slug: String,

    /// Optional description of the organization.
    ///
    /// This becomes organizations.description.
    #[validate(length(max = 1000, message = "must be at most 1000 characters"))]
    pub org_description: Option<String>,

    /// Optional public contact email for the organization.
    ///
    /// This is separate from the owner's login email.
    ///
    /// Example:
    /// `owner@example.com` or `organization@example.com`.
    ///
    /// The owner's email is stored in users.email.
    /// This value is stored in organizations.email.
    #[validate(email(message = "must be a valid email address"))]
    pub org_email: Option<String>,

    /// Optional organization contact phone number.
    #[validate(length(max = 30, message = "must be at most 30 characters"))]
    pub org_phone: Option<String>,

    /// Optional physical/mailing address of the organization.
    #[validate(length(max = 500, message = "must be at most 500 characters"))]
    pub org_address: Option<String>,
}

/// ============================================================================
/// AUDIENCE REGISTRATION
/// ============================================================================

/// Request body for registering a normal audience account.
///
/// Endpoint: `POST /api/v1/auth/register/audience`.
///
/// Audience registration creates:
///
/// - User
/// - AudienceVoter
/// - UserEmailVerificationToken
///
/// The account is created immediately and starts with an unverified email.
/// Email verification is therefore a capability/state transition rather
/// than a prerequisite for creating the account.
#[derive(Debug, Deserialize, Validate, Serialize)]
pub struct RegisterAudienceRequest {
    /// Login email address.
    #[validate(email(message = "must be a valid email address"))]
    pub email: String,

    /// Account password.
    ///
    /// Password length and complexity are validated by the application layer.
    pub password: String,

    /// Password confirmation supplied by the client.
    ///
    /// This is intentionally not persisted.
    pub confirm_password: String,

    /// User's first name.
    #[validate(length(min = 1, max = 100, message = "must be between 1 and 100 characters"))]
    pub first_name: String,

    /// Optional middle name.
    #[validate(length(max = 100, message = "must be at most 100 characters"))]
    pub middle_name: Option<String>,

    /// User's last name.
    #[validate(length(min = 1, max = 100, message = "must be between 1 and 100 characters"))]
    pub last_name: String,

    /// Optional phone number.
    #[validate(length(max = 30, message = "must be at most 30 characters"))]
    pub phone: Option<String>,
}

/// Result returned after successful audience registration.
///
/// This represents the application-level result, not the complete database
/// representation of the newly created records.
#[derive(Debug, Serialize, Deserialize)]
pub struct RegisterAudienceResult {
    /// ID of the newly created user account.
    pub user_id: Uuid,

    /// Normalized/accepted email address associated with the account.
    pub email: String,
}

/// ============================================================================
/// AUDIENCE VOTER
/// ============================================================================

/// Public-facing information about the audience voter created for a user.
///
/// The voter identity hash is intentionally NOT exposed here because it is
/// an internal security mechanism and must never be returned to the client.
#[derive(Debug, Serialize, Deserialize)]
pub struct AudienceVoterResult {
    /// ID of the audience voter record.
    pub id: Uuid,

    /// User account associated with the voter.
    pub user_id: Uuid,

    /// Current voter verification status.
    ///
    /// Examples:
    /// - UNVERIFIED
    /// - VERIFIED
    pub verification_status: String,
}

/// ============================================================================
/// GENERIC REGISTRATION RESPONSE
/// ============================================================================

/// Simple response used when an endpoint only needs to return the newly
/// created user ID, email, and a human-readable message.
///
/// Keep this separate from domain models because it represents an HTTP/API
/// response rather than persisted business data.
#[derive(Debug, Serialize, Deserialize)]
pub struct RegisterResponse {
    /// ID of the newly created user.
    pub user_id: Uuid,

    /// Email associated with the new account.
    pub email: String,

    /// Human-readable response message.
    pub message: String,
}

/// ============================================================================
/// EMAIL VERIFICATION
/// ============================================================================

/// Request body for verifying a user's email address.
///
/// Endpoint:
///     POST /api/v1/auth/verify-email
///
/// The submitted code is never stored directly.
/// The application hashes/HMACs the code and compares the resulting value
/// against the stored verification token.
#[derive(Debug, Deserialize, Validate)]
pub struct VerifyEmailRequest {
    /// Email address associated with the verification token.
    #[validate(email(message = "must be a valid email address"))]
    pub email: String,

    /// Six-character verification code sent to the user's email.
    ///
    /// Length is validated here.
    /// The application/workflow is responsible for validating the actual
    /// token value and expiration.
    #[validate(length(min = 6, max = 6, message = "must be exactly 6 digits"))]
    pub code: String,
}

/// ============================================================================
/// VALIDATION HELPERS
/// ============================================================================

/// Organization slug validation.
///
/// Rules:
/// - first character must be a lowercase letter or digit
/// - last character must be a lowercase letter or digit
/// - middle characters may contain lowercase letters, digits, or hyphens
/// - uppercase letters are rejected
/// - spaces are rejected
/// - underscores are rejected
/// - leading hyphens are rejected
/// - trailing hyphens are rejected
///
/// Examples of valid slugs:
/// - my-org
/// - my-org-2026
/// - abc123
///
/// Examples of invalid slugs:
/// - My-Org
/// - my_org
/// - -my-org
/// - my-org-
/// - my org
///
/// Compiled once and reused for all validation requests.
static SLUG_REGEX: once_cell::sync::Lazy<regex::Regex> = once_cell::sync::Lazy::new(|| {
    regex::Regex::new(r"^[a-z0-9][a-z0-9\-]*[a-z0-9]$")
        .expect("organization slug regex must be valid")
});
