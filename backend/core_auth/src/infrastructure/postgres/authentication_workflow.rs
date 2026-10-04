use async_trait::async_trait;
use chrono::{Duration, Utc};
use sqlx::PgPool;

use core_infra::AppError;

use crate::{
    application::ports::authentication_workflow::AuthenticationWorkflow,
    domain::models::user::{User, UserAccountStatus},
    utils::password::verify_password,
};

pub struct PostgresAuthenticationWorkflow {
    max_failed_login_attempts: i32,
    account_lock_duration_minutes: i64,
    login_failure_window_minutes: i64,
    pool: PgPool,
}

impl PostgresAuthenticationWorkflow {
    pub fn new(
        pool: PgPool,
        max_failed_login_attempts: i32,
        account_lock_duration_minutes: i64,
        login_failure_window_minutes: i64,
    ) -> Self {
        Self {
            pool,
            max_failed_login_attempts,
            account_lock_duration_minutes,
            login_failure_window_minutes,
        }
    }
}

#[async_trait]
impl AuthenticationWorkflow for PostgresAuthenticationWorkflow {
    async fn authenticate(&self, email: &str, password: &str) -> Result<User, AppError> {
        // =====================================================================
        // 1. Find user
        // =====================================================================

        let user = sqlx::query_as!(
            UserRow,
            r#"
            SELECT
                id,
                email::text AS "email!",
                password_hash,
                first_name,
                middle_name,
                last_name,
                phone,
                profile_image_url,
                status AS "status: String",
                email_verified_at,
                last_login_at,
                failed_login_attempts,
                locked_until,
                created_at,
                updated_at,
                failed_login_window_started_at
            FROM users
            WHERE email = $1
            "#,
            email
        )
        .fetch_optional(&self.pool)
        .await
        .map_err(|error| AppError::Database(Box::new(error)))?;

        let user = match user {
            Some(user) => user,

            // Never reveal whether an email address exists.
            None => {
                return Err(AppError::InvalidCredentials);
            }
        };

        let now = Utc::now();

        // =====================================================================
        // 2. Check whether account is currently locked
        // =====================================================================

        if let Some(locked_until) = user.locked_until {
            if locked_until > now {
                let retry_after_seconds = (locked_until - now).num_seconds().max(1);

                return Err(AppError::AccountLocked {
                    retry_after_seconds,
                });
            }
        }

        // =====================================================================
        // 3. Make sure the account has a password
        // =====================================================================

        let password_hash = match user.password_hash.as_deref() {
            Some(hash) => hash,

            None => {
                return Err(AppError::InvalidCredentials);
            }
        };

        // =====================================================================
        // 4. Verify password
        // =====================================================================

        let password_valid = verify_password(password, password_hash)?;

        if !password_valid {
            // -----------------------------------------------------------------
            // Determine failure window
            // -----------------------------------------------------------------

            let (failed_attempts, failure_window_started_at) =
                match user.failed_login_window_started_at {
                    Some(window_started_at)
                        if now - window_started_at
                            < Duration::minutes(self.login_failure_window_minutes) =>
                    {
                        (
                            user.failed_login_attempts.saturating_add(1),
                            Some(window_started_at),
                        )
                    }

                    // Previous failure window expired.
                    _ => (1, Some(now)),
                };

            // -----------------------------------------------------------------
            // Determine whether this failure reaches the lockout threshold
            // -----------------------------------------------------------------

            let locked_until = if failed_attempts >= self.max_failed_login_attempts {
                Some(now + Duration::minutes(self.account_lock_duration_minutes))
            } else {
                None
            };

            // -----------------------------------------------------------------
            // Persist failed-login state
            // -----------------------------------------------------------------

            sqlx::query(
                r#"
                UPDATE users
                SET
                    failed_login_attempts = $1,
                    failed_login_window_started_at = $2,
                    locked_until = $3,
                    updated_at = now()
                WHERE id = $4
                "#,
            )
            .bind(failed_attempts)
            .bind(failure_window_started_at)
            .bind(locked_until)
            .bind(user.id)
            .execute(&self.pool)
            .await
            .map_err(|error| AppError::Database(Box::new(error)))?;

            // -----------------------------------------------------------------
            // Keep failed-password responses generic.
            //
            // The account is now locked in the database if the threshold
            // was reached. The next login attempt will return ACCOUNT_LOCKED
            // together with the remaining lock duration.
            // -----------------------------------------------------------------

            return Err(AppError::InvalidCredentials);
        }

        // =====================================================================
        // 5. Check account status
        // =====================================================================

        let status = UserAccountStatus::from_str(&user.status);

        match status {
            UserAccountStatus::Active => {}

            UserAccountStatus::Pending
            | UserAccountStatus::Suspended
            | UserAccountStatus::Deactivated => {
                return Err(AppError::AccountInactive);
            }
        }

        // =====================================================================
        // 6. Successful login
        //
        // Reset all failed-login state.
        // =====================================================================

        let updated_user = sqlx::query_as!(
            UserRow,
            r#"
            UPDATE users
            SET
                failed_login_attempts = 0,
                failed_login_window_started_at = NULL,
                locked_until = NULL,
                last_login_at = now(),
                updated_at = now()
            WHERE id = $1
            RETURNING
                id,
                email::text AS "email!",
                password_hash,
                first_name,
                middle_name,
                last_name,
                phone,
                profile_image_url,
                status AS "status: String",
                email_verified_at,
                last_login_at,
                failed_login_attempts,
                locked_until,
                created_at,
                updated_at,
                failed_login_window_started_at
            "#,
            user.id
        )
        .fetch_one(&self.pool)
        .await
        .map_err(|error| AppError::Database(Box::new(error)))?;

        // =====================================================================
        // 7. Convert database row into domain User
        // =====================================================================

        Ok(User {
            id: updated_user.id,
            email: updated_user.email,
            password_hash: updated_user.password_hash,
            first_name: updated_user.first_name,
            middle_name: updated_user.middle_name,
            last_name: updated_user.last_name,
            phone: updated_user.phone,
            profile_image_url: updated_user.profile_image_url,
            status: UserAccountStatus::from_str(&updated_user.status),
            email_verified_at: updated_user.email_verified_at,
            last_login_at: updated_user.last_login_at,
            failed_login_attempts: updated_user.failed_login_attempts,
            failed_login_window_started_at: updated_user.failed_login_window_started_at,
            locked_until: updated_user.locked_until,
            created_at: updated_user.created_at,
            updated_at: updated_user.updated_at,
        })
    }
}

// =============================================================================
// Database Row
// =============================================================================

#[derive(Debug)]
struct UserRow {
    id: uuid::Uuid,
    email: String,
    password_hash: Option<String>,
    first_name: String,
    middle_name: Option<String>,
    last_name: String,
    phone: Option<String>,
    profile_image_url: Option<String>,
    status: String,
    email_verified_at: Option<chrono::DateTime<chrono::Utc>>,
    last_login_at: Option<chrono::DateTime<chrono::Utc>>,
    failed_login_attempts: i32,
    locked_until: Option<chrono::DateTime<chrono::Utc>>,
    created_at: chrono::DateTime<chrono::Utc>,
    updated_at: chrono::DateTime<chrono::Utc>,
    // Added by migration 015 — physically at the end of the table
    failed_login_window_started_at: Option<chrono::DateTime<chrono::Utc>>,
}
