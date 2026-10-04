use crate::{
    application::ports::profile_workflow::ProfileWorkflow,
    contracts::profile::{ProfileResponse, UpdateProfileRequest},
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
    first_name: String,
    middle_name: Option<String>,
    last_name: String,
    phone: Option<String>,
    profile_image_url: Option<String>,
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
                  AND r.scope = 'ORGANIZATION'::role_scope
                  AND r.is_active = TRUE
                  AND r.code = $2
                LIMIT 1
                "#,
            )
            .bind(user_id)
            .bind(match role {
                "org_owner"   => "ORG_OWNER",
                "coordinator" => "ORG_COORDINATOR",
                _             => return Ok(None),
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
        first_name: row.first_name,
        middle_name: row.middle_name,
        last_name: row.last_name,
        phone: row.phone,
        profile_image_url: row.profile_image_url,
        role: role.to_owned(),
        organization_id,
    }
}

#[async_trait]
impl ProfileWorkflow for PostgresProfileWorkflow {
    async fn get(&self, id: Uuid, role: &str) -> Result<ProfileResponse, AppError> {
        let row = sqlx::query_as::<_, ProfileRow>(
            "SELECT id, email, first_name, middle_name, last_name, phone, profile_image_url \
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
             RETURNING id, email, first_name, middle_name, last_name, phone, profile_image_url",
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
}
