use std::sync::Arc;

use chrono::{Duration, Utc};
use uuid::Uuid;

use core_infra::AppError;

use crate::{
    application::ports::{email_service::EmailSender, registration_workflow::RegistrationWorkflow},
    contracts::registration::{RegisterAudienceRequest, RegisterOrgOwnerRequest, RegisterResponse},
    domain::models::{
        audience_voters::AudienceVoter,
        organization::Organization,
        organization_members::OrganizationMember,
        user::{User, UserAccountStatus},
        user_email_verification_tokens::UserEmailVerificationToken,
    },
    utils::{
        password::hash_password,
        password_validation::validate_password,
        verification::{generate_verification_code, hash_verification_code},
        voter_identity::generate_voter_identity_hash,
    },
};

/// ============================================================================
/// REGISTRATION APPLICATION
/// ============================================================================
///
/// Coordinates account registration use cases.
///
/// This layer is responsible for application/business orchestration:
///
/// - validating registration-specific business rules
/// - validating password confirmation
/// - validating password complexity
/// - hashing passwords
/// - generating email verification codes
/// - creating domain objects
/// - invoking the registration workflow
/// - sending verification emails
///
/// This layer does NOT contain:
///
/// - SQLx
/// - SQL queries
/// - database transactions
/// - database-specific role lookups
///
/// Those responsibilities belong to RegistrationWorkflow and its
/// infrastructure implementation.
/// ============================================================================

pub struct RegistrationApplication {
    workflow: Arc<dyn RegistrationWorkflow>,

    /// Secret used to HMAC/hash email verification codes before persistence.
    verification_secret: String,

    /// Secret used to generate the stable voter identity hash.
    ///
    /// Only used for audience registration.
    voter_identity_secret: String,

    /// Sends account verification emails.
    email_sender: Arc<dyn EmailSender>,

    /// Number of minutes before a verification code expires.
    email_code_expiry_minutes: i64,
}

impl RegistrationApplication {
    /// Creates a new registration application.
    pub fn new(
        workflow: Arc<dyn RegistrationWorkflow>,
        verification_secret: String,
        voter_identity_secret: String,
        email_sender: Arc<dyn EmailSender>,
        email_code_expiry_minutes: i64,
    ) -> Self {
        Self {
            workflow,
            verification_secret,
            voter_identity_secret,
            email_sender,
            email_code_expiry_minutes,
        }
    }

    // ========================================================================
    // AUDIENCE REGISTRATION
    // ========================================================================

    /// Registers a normal audience account.
    ///
    /// Registration creates:
    ///
    ///     users
    ///       └── audience_voters
    ///       └── user_email_verification_tokens
    ///
    /// These records are persisted atomically by RegistrationWorkflow.
    ///
    /// Email verification does not block account creation.
    /// The newly created account starts as ACTIVE with no verified email.
    pub async fn register_audience(
        &self,
        request: RegisterAudienceRequest,
    ) -> Result<RegisterResponse, AppError> {
        // --------------------------------------------------------------------
        // Password confirmation
        // --------------------------------------------------------------------
        //
        // The confirmation value is never stored.
        //
        // This must happen before password hashing so that we don't perform
        // an expensive Argon2 operation when the two submitted passwords
        // already disagree.

        if request.password != request.confirm_password {
            return Err(AppError::BadRequest("passwords do not match".to_string()));
        }

        // --------------------------------------------------------------------
        // Password complexity
        // --------------------------------------------------------------------
        //
        // Length is handled by the request validator.
        // validate_password() handles the application-level complexity rules:
        //
        // - uppercase
        // - lowercase
        // - number
        // - special character
        //
        // The existing password utility returns validator::ValidationError,
        // so convert it into the application's public bad-request error here.

        validate_password(&request.password).map_err(|error| {
            AppError::BadRequest(
                error
                    .message
                    .map(|message| message.to_string())
                    .unwrap_or_else(|| "invalid password".to_string()),
            )
        })?;

        // --------------------------------------------------------------------
        // Password hashing
        // --------------------------------------------------------------------

        let password_hash = hash_password(&request.password)?;

        // --------------------------------------------------------------------
        // Verification code generation
        // --------------------------------------------------------------------
        //
        // The raw six-digit code is sent by email.
        // Only the HMAC-derived hash is persisted.

        let verification_code = generate_verification_code();

        let token_hash =
            hash_verification_code(&verification_code, self.verification_secret.as_bytes());

        // --------------------------------------------------------------------
        // Domain objects
        // --------------------------------------------------------------------

        let now = Utc::now();
        let user_id = Uuid::new_v4();

        let user = User {
            id: user_id,
            email: request.email,
            password_hash: Some(password_hash),
            first_name: request.first_name,
            middle_name: request.middle_name,
            last_name: request.last_name,
            phone: request.phone,
            profile_image_url: None,
            status: UserAccountStatus::Active,
            email_verified_at: None,
            last_login_at: None,
            failed_login_attempts: 0,
            failed_login_window_started_at: None,
            locked_until: None,
            created_at: now,
            updated_at: now,
        };

        let audience_voter = AudienceVoter {
            id: Uuid::new_v4(),
            user_id,
            voter_identity_hash: generate_voter_identity_hash(
                user_id,
                self.voter_identity_secret.as_bytes(),
            ),
            verification_status: "UNVERIFIED".to_string(),
            created_at: now,
        };

        let verification_token = UserEmailVerificationToken {
            id: Uuid::new_v4(),
            user_id,
            token_hash,
            expires_at: now + Duration::minutes(self.email_code_expiry_minutes),
            verified_at: None,
            created_at: now,
        };

        // --------------------------------------------------------------------
        // Database workflow
        // --------------------------------------------------------------------
        //
        // The workflow owns the database transaction.
        //
        // It atomically creates:
        //
        //     users
        //     audience_voters
        //     user_email_verification_tokens

        self.workflow
            .register_audience(&user, &audience_voter, &verification_token)
            .await?;

        // --------------------------------------------------------------------
        // Verification email
        // --------------------------------------------------------------------

        self.email_sender
            .send_verification_email(
                &user.email,
                &user.first_name,
                &verification_code,
                self.email_code_expiry_minutes,
                "Audience",
            )
            .await?;

        // --------------------------------------------------------------------
        // Response
        // --------------------------------------------------------------------

        Ok(RegisterResponse {
            user_id,
            email: user.email,
            message: "Registered successfully. Please verify your email address.".to_string(),
        })
    }

    // ========================================================================
    // ORGANIZATION OWNER REGISTRATION
    // ========================================================================

    /// Registers a new organization owner.
    ///
    /// The operation creates:
    ///
    ///     users
    ///       │
    ///       └── organizations
    ///             │
    ///             └── organization_members
    ///                   │
    ///                   └── organization_member_roles
    ///                         │
    ///                         └── ORG_OWNER
    ///
    ///     users
    ///       │
    ///       └── user_email_verification_tokens
    ///
    /// The ORG_OWNER role is NOT supplied by the request.
    ///
    /// The workflow knows that this particular operation represents the
    /// creation of an organization owner and therefore resolves the
    /// ORG_OWNER role itself.
    pub async fn register_org_owner(
        &self,
        request: RegisterOrgOwnerRequest,
    ) -> Result<RegisterResponse, AppError> {
        // --------------------------------------------------------------------
        // Password confirmation
        // --------------------------------------------------------------------
        //
        // confirm_password is only an input verification value.
        // It is never stored in the database.

        if request.password != request.confirm_password {
            return Err(AppError::BadRequest("passwords do not match".to_string()));
        }

        // --------------------------------------------------------------------
        // Password complexity
        // --------------------------------------------------------------------
        //
        // The request validator handles the basic 8-128 character constraint.
        //
        // validate_password() enforces the stronger rules:
        //
        // - uppercase character
        // - lowercase character
        // - number
        // - special character

        validate_password(&request.password).map_err(|error| {
            AppError::BadRequest(
                error
                    .message
                    .map(|message| message.to_string())
                    .unwrap_or_else(|| "invalid password".to_string()),
            )
        })?;

        // --------------------------------------------------------------------
        // Password hashing
        // --------------------------------------------------------------------

        let password_hash = hash_password(&request.password)?;

        // --------------------------------------------------------------------
        // Verification code generation
        // --------------------------------------------------------------------
        //
        // The raw code is sent to the user's email.
        // Only the HMAC hash is persisted.

        let verification_code = generate_verification_code();

        let token_hash =
            hash_verification_code(&verification_code, self.verification_secret.as_bytes());

        // --------------------------------------------------------------------
        // Common registration values
        // --------------------------------------------------------------------

        let now = Utc::now();
        let user_id = Uuid::new_v4();

        // --------------------------------------------------------------------
        // User
        // --------------------------------------------------------------------
        //
        // Organization owners are still normal users.
        // There is no separate OrganizationOwner user entity.

        let user = User {
            id: user_id,
            email: request.email,
            password_hash: Some(password_hash),
            first_name: request.first_name,
            middle_name: request.middle_name,
            last_name: request.last_name,
            phone: request.phone,
            profile_image_url: None,
            status: UserAccountStatus::Active,
            email_verified_at: None,
            last_login_at: None,
            failed_login_attempts: 0,
            failed_login_window_started_at: None,
            locked_until: None,
            created_at: now,
            updated_at: now,
        };

        // --------------------------------------------------------------------
        // Organization
        // --------------------------------------------------------------------
        //
        // The newly created user becomes the organization owner through
        // organizations.owner_id.
        //
        // The workflow will additionally create the organization membership
        // and ORG_OWNER role assignment.

        let organization_id = Uuid::new_v4();

        let organization = Organization {
            id: organization_id,
            owner_id: user_id,
            name: request.org_name,
            slug: request.org_slug,
            description: request.org_description,
            logo_url: None,
            email: request.org_email,
            phone: request.org_phone,
            address: request.org_address,
            is_active: true,
            created_at: now,
            updated_at: now,
        };

        // --------------------------------------------------------------------
        // Organization member
        // --------------------------------------------------------------------
        //
        // The owner is also an organization member.
        //
        // We create the membership here as a domain object, but the actual
        // ORG_OWNER role assignment remains inside the database workflow.

        let member = OrganizationMember {
            id: Uuid::new_v4(),
            organization_id,
            user_id,
            is_active: true,
            joined_at: now,
            created_at: now,
            updated_at: now,
        };

        // --------------------------------------------------------------------
        // Email verification token
        // --------------------------------------------------------------------

        let verification_token = UserEmailVerificationToken {
            id: Uuid::new_v4(),
            user_id,
            token_hash,
            expires_at: now + Duration::minutes(self.email_code_expiry_minutes),
            verified_at: None,
            created_at: now,
        };

        // --------------------------------------------------------------------
        // Registration workflow
        // --------------------------------------------------------------------
        //
        // The workflow owns the transaction and creates:
        //
        //     users
        //     organizations
        //     organization_members
        //     organization_member_roles
        //     user_email_verification_tokens
        //
        // If any operation fails, the entire registration is rolled back.

        self.workflow
            .register_organization_owner(&user, &organization, &member, &verification_token)
            .await?;

        // --------------------------------------------------------------------
        // Verification email
        // --------------------------------------------------------------------
        //
        // Registration is already complete at this point.
        //
        // Email verification is not required to create or access the account.
        // Later privileged operations can require email_verified_at.

        self.email_sender
            .send_verification_email(
                &user.email,
                &user.first_name,
                &verification_code,
                self.email_code_expiry_minutes,
                "Organization Owner",
            )
            .await?;

        // --------------------------------------------------------------------
        // HTTP/API response
        // --------------------------------------------------------------------

        Ok(RegisterResponse {
            user_id,
            email: user.email,
            message: "Organization registered successfully. Please verify your email address."
                .to_string(),
        })
    }
}
