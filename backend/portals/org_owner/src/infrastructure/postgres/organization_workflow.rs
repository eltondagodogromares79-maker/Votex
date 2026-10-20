use async_trait::async_trait;
use core_infra::AppError;
use sqlx::{FromRow, PgPool};
use uuid::Uuid;

use crate::{
    application::ports::organization_workflow::OrganizationWorkflow,
    contracts::organization::{OrganizationProfile, UpdateOrganizationProfile},
};

pub struct PostgresOrganizationWorkflow {
    pool: PgPool,
}

impl PostgresOrganizationWorkflow {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[derive(FromRow)]
struct OrganizationRow {
    id: Uuid,
    name: String,
    slug: String,
    description: Option<String>,
    email: Option<String>,
    phone: Option<String>,
    address: Option<String>,
    logo_url: Option<String>,
}

impl From<OrganizationRow> for OrganizationProfile {
    fn from(row: OrganizationRow) -> Self {
        Self {
            id: row.id,
            name: row.name,
            slug: row.slug,
            description: row.description,
            email: row.email,
            phone: row.phone,
            address: row.address,
            logo_url: row.logo_url,
        }
    }
}

fn db(error: sqlx::Error) -> AppError {
    AppError::Database(Box::new(error))
}

const COLUMNS: &str =
    "id, name, slug::text AS slug, description, email::text AS email, phone, address, logo_url";

#[async_trait]
impl OrganizationWorkflow for PostgresOrganizationWorkflow {
    async fn get_organization(
        &self,
        organization_id: Uuid,
    ) -> Result<OrganizationProfile, AppError> {
        let sql = format!("SELECT {COLUMNS} FROM organizations WHERE id = $1 AND is_active = TRUE");
        sqlx::query_as::<_, OrganizationRow>(&sql)
            .bind(organization_id)
            .fetch_optional(&self.pool)
            .await
            .map_err(db)?
            .map(Into::into)
            .ok_or_else(|| AppError::NotFound("organization".into()))
    }

    async fn update_organization(
        &self,
        organization_id: Uuid,
        profile: UpdateOrganizationProfile,
    ) -> Result<OrganizationProfile, AppError> {
        let sql = format!(
            "UPDATE organizations SET name = $2, slug = $3, description = $4, email = $5, phone = $6, address = $7, logo_url = $8, updated_at = now() WHERE id = $1 AND is_active = TRUE RETURNING {COLUMNS}"
        );
        sqlx::query_as::<_, OrganizationRow>(&sql)
            .bind(organization_id)
            .bind(profile.name)
            .bind(profile.slug)
            .bind(profile.description)
            .bind(profile.email)
            .bind(profile.phone)
            .bind(profile.address)
            .bind(profile.logo_url)
            .fetch_optional(&self.pool)
            .await
            .map_err(|error| match &error {
                sqlx::Error::Database(db_error) if db_error.code().as_deref() == Some("23505") => {
                    AppError::Conflict("That organization URL slug is already in use.".into())
                }
                _ => db(error),
            })?
            .map(Into::into)
            .ok_or_else(|| AppError::NotFound("organization".into()))
    }
}
