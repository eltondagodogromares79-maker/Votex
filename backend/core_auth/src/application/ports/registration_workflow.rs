use async_trait::async_trait;

use core_infra::AppError;

use crate::domain::models::{
    audience_voters::AudienceVoter, organization::Organization,
    organization_members::OrganizationMember, user::User,
    user_email_verification_tokens::UserEmailVerificationToken,
};

/// ============================================================================
/// REGISTRATION WORKFLOW
/// ============================================================================
///
/// Coordinates registration operations that span multiple database tables.
///
/// The application layer is responsible for:
/// - validating the incoming request
/// - hashing passwords
/// - generating verification data
/// - constructing the required domain models
///
/// The workflow is responsible for:
/// - persisting all related records
/// - maintaining the database transaction boundary
/// - enforcing database-level relationships
/// - resolving fixed registration roles such as ORG_OWNER
/// - rolling back the entire operation when any step fails
///
/// SQLx and database-specific code must remain outside the application layer.
/// ============================================================================

#[cfg_attr(test, mockall::automock)]
#[async_trait]
pub trait RegistrationWorkflow: Send + Sync {
    /// =========================================================================
    /// AUDIENCE REGISTRATION
    /// =========================================================================
    ///
    /// Registers a normal audience account.
    ///
    /// Records created by the implementation:
    ///
    /// ```text
    /// users
    ///   ├── audience_voters
    ///   └── user_email_verification_tokens
    /// ```
    ///
    /// All records must be created inside one database transaction.
    ///
    /// If any insert fails, the entire registration must be rolled back.
    async fn register_audience(
        &self,
        user: &User,
        audience_voter: &AudienceVoter,
        verification_token: &UserEmailVerificationToken,
    ) -> Result<(), AppError>;

    /// =========================================================================
    /// ORGANIZATION OWNER REGISTRATION
    /// =========================================================================
    ///
    /// Registers a new organization together with its initial owner.
    ///
    /// Records created by the implementation:
    ///
    /// ```text
    /// users ── organizations ── organization_members ── organization_member_roles ── ORG_OWNER
    ///   └── user_email_verification_tokens
    /// ```
    ///
    /// The ORG_OWNER role is NOT supplied by the caller.
    ///
    /// This is intentional:
    ///
    /// ```text
    /// register_organization_owner()
    /// ```
    ///
    /// already defines the business operation being performed. Therefore,
    /// the workflow knows that the newly created organization member must
    /// receive the ORG_OWNER role.
    ///
    /// The implementation is responsible for resolving the ORG_OWNER role
    /// from the roles table and creating the corresponding
    /// organization_member_roles record.
    ///
    /// All records must be created inside one database transaction.
    ///
    /// If any step fails:
    ///
    /// ```text
    /// User, Organization, OrganizationMember, OrganizationMemberRole,
    /// and EmailVerificationToken
    /// ```
    ///
    /// must all be rolled back together.
    async fn register_organization_owner(
        &self,
        user: &User,
        organization: &Organization,
        member: &OrganizationMember,
        verification_token: &UserEmailVerificationToken,
    ) -> Result<(), AppError>;
}
