use crate::utils::password::verify_password;
use crate::{
    application::ports::profile_workflow::ProfileWorkflow,
    contracts::profile::{ProfileResponse, RequestEmailChange, UpdateProfileRequest},
};
use async_trait::async_trait;
use core_infra::AppError;
use sqlx::{FromRow, PgPool};
use uuid::Uuid;

pub struct PostgresProfileWorkflow {
    pool: PgPool,
}

impl PostgresProfileWorkflow {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[derive(FromRow)]
struct ProfileRow {
    id: Uuid,
    email: String,
    pending_email: Option<String>,
    email_verified_at: Option<chrono::DateTime<chrono::Utc>>,
    first_name: String,
    middle_name: Option<String>,
    last_name: String,
    phone: Option<String>,
    profile_image_url: Option<String>,
    must_change_password: bool,
}

fn db(e: sqlx::Error) -> AppError {
    AppError::Database(Box::new(e))
}

/// Resolve the primary organization ID for roles that are scoped to an organization.
/// Returns None for roles that are not organization-scoped (admin, judge, tabulator, audience).
async fn resolve_organization_id(
    pool: &PgPool,
    user_id: Uuid,
    role: &str,
) -> Result<Option<Uuid>, AppError> {
    match role {
        "org_owner" | "coordinator" => {
            let org_id: Option<Uuid> = sqlx::query_scalar(
                r#"
                SELECT om.organization_id
                FROM organization_members om
                INNER JOIN organization_member_roles omr ON omr.organization_member_id = om.id
                INNER JOIN roles r ON r.id = omr.role_id
                WHERE om.user_id = $1
                  AND om.is_active = TRUE
                  AND omr.is_active = TRUE
                  AND r.scope = 'ORGANIZATION'::role_scope
                  AND r.is_active = TRUE
                  AND r.code = $2
                LIMIT 1
                "#,
            )
            .bind(user_id)
            .bind(match role {
                "org_owner" => "ORG_OWNER",
                "coordinator" => "ORG_COORDINATOR",
                _ => return Ok(None),
            })
            .fetch_optional(pool)
            .await
            .map_err(db)?;

            Ok(org_id)
        }
        _ => Ok(None),
    }
}

fn to_response(row: ProfileRow, role: &str, organization_id: Option<Uuid>) -> ProfileResponse {
    ProfileResponse {
        user_id: row.id,
        email: row.email,
        pending_email: row.pending_email,
        email_verified_at: row.email_verified_at,
        first_name: row.first_name,
        middle_name: row.middle_name,
        last_name: row.last_name,
        phone: row.phone,
        profile_image_url: row.profile_image_url,
        must_change_password: row.must_change_password,
        role: role.to_owned(),
        organization_id,
    }
}

#[async_trait]
impl ProfileWorkflow for PostgresProfileWorkflow {
    async fn get(&self, id: Uuid, role: &str) -> Result<ProfileResponse, AppError> {
        let row = sqlx::query_as::<_, ProfileRow>(
            "SELECT id, email, pending_email, email_verified_at, first_name, middle_name, last_name, phone, profile_image_url, must_change_password \
             FROM users WHERE id = $1 AND status = 'ACTIVE'::user_account_status",
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .map_err(db)?
        .ok_or_else(|| AppError::NotFound("active user".into()))?;

        let org_id = resolve_organization_id(&self.pool, id, role).await?;

        Ok(to_response(row, role, org_id))
    }

    async fn update(
        &self,
        id: Uuid,
        role: &str,
        p: UpdateProfileRequest,
    ) -> Result<ProfileResponse, AppError> {
        let row = sqlx::query_as::<_, ProfileRow>(
            "UPDATE users \
             SET first_name = $2, middle_name = $3, last_name = $4, \
                 phone = $5, profile_image_url = $6, updated_at = now() \
             WHERE id = $1 AND status = 'ACTIVE'::user_account_status \
                 RETURNING id, email, pending_email, email_verified_at, first_name, middle_name, last_name, phone, profile_image_url, must_change_password",
        )
        .bind(id)
        .bind(p.first_name)
        .bind(p.middle_name)
        .bind(p.last_name)
        .bind(p.phone)
        .bind(p.profile_image_url)
        .fetch_optional(&self.pool)
        .await
        .map_err(db)?
        .ok_or_else(|| AppError::NotFound("active user".into()))?;

        let org_id = resolve_organization_id(&self.pool, id, role).await?;

        Ok(to_response(row, role, org_id))
    }

    async fn request_email_change(
        &self,
        id: Uuid,
        role: &str,
        request: RequestEmailChange,
    ) -> Result<ProfileResponse, AppError> {
        let email = request.email.trim().to_owned();
        let email_verified: Option<bool> = sqlx::query_scalar(
            "SELECT email_verified_at IS NOT NULL FROM users WHERE id = $1 AND status = 'ACTIVE'::user_account_status",
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .map_err(db)?;
        match email_verified {
            None => return Err(AppError::NotFound("active user".into())),
            Some(true) => {
                return Err(AppError::BadRequest(
                    "A verified email address cannot be changed.".into(),
                ));
            }
            Some(false) => {}
        }

        let occupied: bool = sqlx::query_scalar(
            "SELECT EXISTS (SELECT 1 FROM users WHERE id <> $1 AND (email = $2 OR pending_email = $2))",
        )
        .bind(id)
        .bind(&email)
        .fetch_one(&self.pool)
        .await
        .map_err(db)?;
        if occupied {
            return Err(AppError::EmailTaken);
        }

        let mut transaction = self.pool.begin().await.map_err(db)?;
        let row = sqlx::query_as::<_, ProfileRow>(
            "UPDATE users SET pending_email = CASE WHEN email = $2 THEN NULL ELSE $2 END, updated_at = now() \
             WHERE id = $1 AND status = 'ACTIVE'::user_account_status AND email_verified_at IS NULL \
             RETURNING id, email, pending_email, email_verified_at, first_name, middle_name, last_name, phone, profile_image_url, must_change_password",
        )
        .bind(id)
        .bind(email)
        .fetch_optional(&mut *transaction)
        .await
        .map_err(|error| match &error {
            sqlx::Error::Database(database_error) if database_error.code().as_deref() == Some("23505") => AppError::EmailTaken,
            _ => db(error),
        })?
        .ok_or_else(|| AppError::BadRequest("A verified email address cannot be changed.".into()))?;
        sqlx::query("UPDATE user_email_verification_tokens SET expires_at = now() WHERE user_id = $1 AND verified_at IS NULL")
            .bind(id)
            .execute(&mut *transaction)
            .await
            .map_err(db)?;
        transaction.commit().await.map_err(db)?;
        let org_id = resolve_organization_id(&self.pool, id, role).await?;
        Ok(to_response(row, role, org_id))
    }

    async fn delete_account(&self, id: Uuid, current_password: &str) -> Result<(), AppError> {
        let mut tx = self.pool.begin().await.map_err(db)?;
        let password_hash = sqlx::query_scalar::<_, Option<String>>(
            "SELECT password_hash FROM users WHERE id = $1 AND status = 'ACTIVE'::user_account_status FOR UPDATE",
        )
        .bind(id)
        .fetch_optional(&mut *tx)
        .await
        .map_err(db)?
        .flatten()
        .ok_or(AppError::InvalidCredentials)?;
        if !verify_password(current_password, &password_hash)? {
            return Err(AppError::InvalidCredentials);
        }

        // Preserve scoring, billing, and audit references while removing the
        // account's ability to sign in and its personal profile information.
        sqlx::query("UPDATE organizations SET is_active = FALSE WHERE owner_id = $1")
            .bind(id)
            .execute(&mut *tx)
            .await
            .map_err(db)?;
        sqlx::query(
            "UPDATE pageants SET status = 'ARCHIVED'::pageant_status, is_public = FALSE, updated_at = now() \
             WHERE organization_id IN (SELECT id FROM organizations WHERE owner_id = $1)",
        )
        .bind(id)
        .execute(&mut *tx)
        .await
        .map_err(db)?;
        // These rows can span organizations and pageants. Deactivate only the
        // authenticated caller's own assignments through a narrowly scoped
        // SECURITY DEFINER function; ordinary staff cannot directly update
        // membership rows under tenant RLS.
        sqlx::query("SELECT public.votex_deactivate_own_assignments()")
            .execute(&mut *tx)
            .await
            .map_err(db)?;
        sqlx::query("DELETE FROM user_system_roles WHERE user_id = $1")
            .bind(id)
            .execute(&mut *tx)
            .await
            .map_err(db)?;
        sqlx::query("DELETE FROM user_auth_providers WHERE user_id = $1")
            .bind(id)
            .execute(&mut *tx)
            .await
            .map_err(db)?;
        sqlx::query("DELETE FROM user_password_reset_tokens WHERE user_id = $1")
            .bind(id)
            .execute(&mut *tx)
            .await
            .map_err(db)?;
        sqlx::query("DELETE FROM user_email_verification_tokens WHERE user_id = $1")
            .bind(id)
            .execute(&mut *tx)
            .await
            .map_err(db)?;
        sqlx::query("UPDATE user_refresh_tokens SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL")
            .bind(id).execute(&mut *tx).await.map_err(db)?;

        let anonymized_email = format!("deleted+{}@account.invalid", id);
        sqlx::query(
            "UPDATE users SET email = $2, pending_email = NULL, email_verified_at = NULL, \
             password_hash = NULL, first_name = 'Deleted', middle_name = NULL, last_name = 'Account', \
             phone = NULL, profile_image_url = NULL, status = 'DEACTIVATED'::user_account_status, \
             failed_login_attempts = 0, locked_until = NULL, updated_at = now() WHERE id = $1",
        )
        .bind(id)
        .bind(anonymized_email)
        .execute(&mut *tx)
        .await
        .map_err(db)?;
        tx.commit().await.map_err(db)
    }
}
