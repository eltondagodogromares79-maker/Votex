use async_trait::async_trait;
use sqlx::PgPool;

use core_infra::AppError;

use crate::{
    application::ports::registration_workflow::RegistrationWorkflow,
    domain::models::{
        audience_voters::AudienceVoter, organization::Organization,
        organization_members::OrganizationMember, user::User,
        user_email_verification_tokens::UserEmailVerificationToken,
    },
};

pub struct PostgresRegistrationWorkflow {
    pool: PgPool,
}

impl PostgresRegistrationWorkflow {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

fn map_database_error(error: sqlx::Error) -> AppError {
    match &error {
        sqlx::Error::Database(database_error)
            if database_error.code().as_deref() == Some("23505") =>
        {
            if database_error
                .constraint()
                .is_some_and(|constraint| constraint == "users_email_key")
            {
                return AppError::EmailTaken;
            }

            AppError::Database(Box::new(error))
        }

        _ => AppError::Database(Box::new(error)),
    }
}

#[async_trait]
impl RegistrationWorkflow for PostgresRegistrationWorkflow {
    async fn register_audience(
        &self,
        user: &User,
        audience_voter: &AudienceVoter,
        verification_token: &UserEmailVerificationToken,
    ) -> Result<(), AppError> {
        let mut transaction = self
            .pool
            .begin()
            .await
            .map_err(|error| AppError::Database(Box::new(error)))?;

        // ------------------------------------------------------------
        // Check whether the email already exists.
        // ------------------------------------------------------------

        let existing_user: Option<(uuid::Uuid,)> = sqlx::query_as(
            r#"
            SELECT id
            FROM users
            WHERE email = $1
            "#,
        )
        .bind(&user.email)
        .fetch_optional(&mut *transaction)
        .await
        .map_err(map_database_error)?;

        if existing_user.is_some() {
            return Err(AppError::EmailTaken);
        }

        // ------------------------------------------------------------
        // Create user.
        // ------------------------------------------------------------

        sqlx::query(
            r#"
            INSERT INTO users (
                id,
                email,
                password_hash,
                first_name,
                middle_name,
                last_name,
                phone,
                profile_image_url,
                status,
                email_verified_at,
                last_login_at,
                failed_login_attempts,
                locked_until,
                created_at,
                updated_at
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                $7,
                $8,
                $9::user_account_status,
                $10,
                $11,
                $12,
                $13,
                $14,
                $15
            )
            "#,
        )
        .bind(user.id)
        .bind(&user.email)
        .bind(&user.password_hash)
        .bind(&user.first_name)
        .bind(&user.middle_name)
        .bind(&user.last_name)
        .bind(&user.phone)
        .bind(&user.profile_image_url)
        .bind(user.status.as_str())
        .bind(user.email_verified_at)
        .bind(user.last_login_at)
        .bind(user.failed_login_attempts)
        .bind(user.locked_until)
        .bind(user.created_at)
        .bind(user.updated_at)
        .execute(&mut *transaction)
        .await
        .map_err(map_database_error)?;

        // ------------------------------------------------------------
        // Create audience voter.
        // ------------------------------------------------------------

        sqlx::query(
            r#"
            INSERT INTO audience_voters (
                id,
                user_id,
                voter_identity_hash,
                verification_status,
                created_at
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5
            )
            "#,
        )
        .bind(audience_voter.id)
        .bind(audience_voter.user_id)
        .bind(&audience_voter.voter_identity_hash)
        .bind(&audience_voter.verification_status)
        .bind(audience_voter.created_at)
        .execute(&mut *transaction)
        .await
        .map_err(|error| AppError::Database(Box::new(error)))?;

        // ------------------------------------------------------------
        // Create email verification token.
        // ------------------------------------------------------------

        sqlx::query(
            r#"
            INSERT INTO user_email_verification_tokens (
                id,
                user_id,
                token_hash,
                expires_at,
                verified_at,
                created_at
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6
            )
            "#,
        )
        .bind(verification_token.id)
        .bind(verification_token.user_id)
        .bind(&verification_token.token_hash)
        .bind(verification_token.expires_at)
        .bind(verification_token.verified_at)
        .bind(verification_token.created_at)
        .execute(&mut *transaction)
        .await
        .map_err(|error| AppError::Database(Box::new(error)))?;

        // ------------------------------------------------------------
        // Commit the entire registration.
        // ------------------------------------------------------------

        transaction
            .commit()
            .await
            .map_err(|error| AppError::Database(Box::new(error)))?;

        Ok(())
    }

    //This is for org owner registration section

    async fn register_organization_owner(
        &self,
        user: &User,
        organization: &Organization,
        member: &OrganizationMember,
        verification_token: &UserEmailVerificationToken,
    ) -> Result<(), AppError> {
        let mut transaction = self
            .pool
            .begin()
            .await
            .map_err(|error| AppError::Database(Box::new(error)))?;

        // ------------------------------------------------------------
        // Check whether the email already exists.
        // ------------------------------------------------------------

        let existing_user: Option<(uuid::Uuid,)> = sqlx::query_as(
            r#"
            SELECT id
            FROM users
            WHERE email = $1
            "#,
        )
        .bind(&user.email)
        .fetch_optional(&mut *transaction)
        .await
        .map_err(map_database_error)?;

        if existing_user.is_some() {
            return Err(AppError::EmailTaken);
        }

        // ------------------------------------------------------------
        // Create user.
        // ------------------------------------------------------------

        sqlx::query(
            r#"
            INSERT INTO users (
                id,
                email,
                password_hash,
                first_name,
                middle_name,
                last_name,
                phone,
                profile_image_url,
                status,
                email_verified_at,
                last_login_at,
                failed_login_attempts,
                locked_until,
                created_at,
                updated_at
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                $7,
                $8,
                $9::user_account_status,
                $10,
                $11,
                $12,
                $13,
                $14,
                $15
            )
            "#,
        )
        .bind(user.id)
        .bind(&user.email)
        .bind(&user.password_hash)
        .bind(&user.first_name)
        .bind(&user.middle_name)
        .bind(&user.last_name)
        .bind(&user.phone)
        .bind(&user.profile_image_url)
        .bind(user.status.as_str())
        .bind(user.email_verified_at)
        .bind(user.last_login_at)
        .bind(user.failed_login_attempts)
        .bind(user.locked_until)
        .bind(user.created_at)
        .bind(user.updated_at)
        .execute(&mut *transaction)
        .await
        .map_err(map_database_error)?;

        // ------------------------------------------------------------
        // Create organization.
        // ------------------------------------------------------------

        sqlx::query(
            r#"
            INSERT INTO organizations (
                id,
                owner_id,
                name,
                slug,
                description,
                logo_url,
                email,
                phone,
                address,
                is_active,
                created_at,
                updated_at
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                $7,
                $8,
                $9,
                $10,
                $11,
                $12
            )
            "#,
        )
        .bind(organization.id)
        .bind(organization.owner_id)
        .bind(&organization.name)
        .bind(&organization.slug)
        .bind(&organization.description)
        .bind(&organization.logo_url)
        .bind(&organization.email)
        .bind(&organization.phone)
        .bind(&organization.address)
        .bind(organization.is_active)
        .bind(organization.created_at)
        .bind(organization.updated_at)
        .execute(&mut *transaction)
        .await
        .map_err(|error| match &error {
            sqlx::Error::Database(database_error)
                if database_error.code().as_deref() == Some("23505")
                    && database_error
                        .constraint()
                        .is_some_and(|constraint| constraint == "organizations_slug_key") =>
            {
                AppError::SlugTaken
            }
            _ => map_database_error(error),
        })?;

        // ------------------------------------------------------------
        // Create organization member.
        // ------------------------------------------------------------

        sqlx::query(
            r#"
            INSERT INTO organization_members (
                id,
                organization_id,
                user_id,
                is_active,
                joined_at,
                created_at,
                updated_at
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                $7
            )
            "#,
        )
        .bind(member.id)
        .bind(member.organization_id)
        .bind(member.user_id)
        .bind(member.is_active)
        .bind(member.joined_at)
        .bind(member.created_at)
        .bind(member.updated_at)
        .execute(&mut *transaction)
        .await
        .map_err(map_database_error)?;

        // ------------------------------------------------------------
        // Resolve the ORG_OWNER role.
        //
        // The application does not provide a role_id. The workflow
        // determines the correct system-defined organization role.
        // ------------------------------------------------------------

        let owner_role_id: Option<(uuid::Uuid,)> = sqlx::query_as(
            r#"
            SELECT id
            FROM roles
            WHERE code = 'ORG_OWNER'
              AND scope = 'ORGANIZATION'::role_scope
              AND is_active = TRUE
            "#,
        )
        .fetch_optional(&mut *transaction)
        .await
        .map_err(map_database_error)?;

        let (owner_role_id,) = owner_role_id.ok_or_else(|| {
            AppError::Configuration("ORG_OWNER role is not configured".to_string())
        })?;

        // ------------------------------------------------------------
        // Assign ORG_OWNER role to the organization member.
        // ------------------------------------------------------------

        sqlx::query(
            r#"
            INSERT INTO organization_member_roles (
                id,
                organization_member_id,
                role_id,
                assigned_by,
                created_at
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5
            )
            "#,
        )
        .bind(uuid::Uuid::new_v4())
        .bind(member.id)
        .bind(owner_role_id)
        .bind(None::<uuid::Uuid>)
        .bind(verification_token.created_at)
        .execute(&mut *transaction)
        .await
        .map_err(map_database_error)?;

        // ------------------------------------------------------------
        // Create email verification token.
        // ------------------------------------------------------------

        sqlx::query(
            r#"
            INSERT INTO user_email_verification_tokens (
                id,
                user_id,
                token_hash,
                expires_at,
                verified_at,
                created_at
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6
            )
            "#,
        )
        .bind(verification_token.id)
        .bind(verification_token.user_id)
        .bind(&verification_token.token_hash)
        .bind(verification_token.expires_at)
        .bind(verification_token.verified_at)
        .bind(verification_token.created_at)
        .execute(&mut *transaction)
        .await
        .map_err(map_database_error)?;

        // ------------------------------------------------------------
        // Commit the entire organization registration.
        // ------------------------------------------------------------

        transaction
            .commit()
            .await
            .map_err(|error| AppError::Database(Box::new(error)))?;

        Ok(())
    }
}
