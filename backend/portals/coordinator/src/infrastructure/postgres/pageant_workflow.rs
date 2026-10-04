use async_trait::async_trait;
use chrono::{NaiveDate, NaiveTime};
use core_infra::AppError;
use sqlx::{FromRow, PgPool};
use uuid::Uuid;

use crate::{
    application::ports::pageant_workflow::PageantWorkflow, domain::pageant::AssignedPageant,
};

pub struct PostgresPageantWorkflow {
    pool: PgPool,
}

impl PostgresPageantWorkflow {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[derive(FromRow)]
struct PageantRow {
    id: Uuid,
    organization_id: Uuid,
    organization_name: String,
    created_by: Uuid,
    name: String,
    slug: String,
    description: Option<String>,
    logo_url: Option<String>,
    event_date: Option<NaiveDate>,
    start_time: Option<NaiveTime>,
    end_time: Option<NaiveTime>,
    venue: Option<String>,
    status: String,
    is_public: bool,
}

impl From<PageantRow> for AssignedPageant {
    fn from(row: PageantRow) -> Self {
        Self {
            id: row.id,
            organization_id: row.organization_id,
            organization_name: row.organization_name,
            created_by: row.created_by,
            name: row.name,
            slug: row.slug,
            description: row.description,
            logo_url: row.logo_url,
            event_date: row.event_date,
            start_time: row.start_time,
            end_time: row.end_time,
            venue: row.venue,
            status: row.status,
            is_public: row.is_public,
        }
    }
}

const PAGEANT_COLUMNS: &str = "pageant.id, pageant.organization_id, organization.name AS organization_name, \
    pageant.created_by, pageant.name, pageant.slug::text AS slug, pageant.description, \
    pageant.logo_url, pageant.event_date, pageant.start_time, pageant.end_time, pageant.venue, \
    pageant.status::text AS status, pageant.is_public";

const ASSIGNED_PAGEANT_FROM: &str = "FROM pageants pageant \
    INNER JOIN organizations organization ON organization.id = pageant.organization_id \
    INNER JOIN pageant_member_roles assignment ON assignment.pageant_id = pageant.id \
    INNER JOIN roles assigned_role ON assigned_role.id = assignment.role_id";

#[async_trait]
impl PageantWorkflow for PostgresPageantWorkflow {
    async fn list_assigned(&self, coordinator_id: Uuid) -> Result<Vec<AssignedPageant>, AppError> {
        let query = format!(
            "SELECT {PAGEANT_COLUMNS} {ASSIGNED_PAGEANT_FROM} \
             WHERE assignment.user_id = $1 AND assignment.is_active = TRUE \
               AND assigned_role.code = 'PAGEANT_COORDINATOR' \
               AND assigned_role.scope = 'PAGEANT'::role_scope AND assigned_role.is_active = TRUE \
             ORDER BY pageant.event_date DESC NULLS LAST, pageant.created_at DESC, pageant.id"
        );
        let rows = sqlx::query_as::<_, PageantRow>(&query)
            .bind(coordinator_id)
            .fetch_all(&self.pool)
            .await
            .map_err(database_error)?;
        Ok(rows.into_iter().map(AssignedPageant::from).collect())
    }

    async fn get_assigned(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
    ) -> Result<AssignedPageant, AppError> {
        let query = format!(
            "SELECT {PAGEANT_COLUMNS} {ASSIGNED_PAGEANT_FROM} \
             WHERE assignment.user_id = $1 AND pageant.id = $2 \
               AND assignment.is_active = TRUE \
               AND assigned_role.code = 'PAGEANT_COORDINATOR' \
               AND assigned_role.scope = 'PAGEANT'::role_scope AND assigned_role.is_active = TRUE"
        );
        sqlx::query_as::<_, PageantRow>(&query)
            .bind(coordinator_id)
            .bind(pageant_id)
            .fetch_optional(&self.pool)
            .await
            .map_err(database_error)?
            .map(AssignedPageant::from)
            .ok_or_else(|| AppError::NotFound("assigned pageant".to_owned()))
    }

    async fn update_assigned(
        &self,
        coordinator_id: Uuid,
        pageant: AssignedPageant,
    ) -> Result<AssignedPageant, AppError> {
        let query = format!(
            "UPDATE pageants pageant SET name = $3, slug = $4, description = $5, \
             logo_url = $6, event_date = $7, start_time = $8, end_time = $9, \
             venue = $10, is_public = $11 \
             FROM organizations organization \
             WHERE pageant.id = $1 AND pageant.status <> 'ARCHIVED'::pageant_status \
               AND organization.id = pageant.organization_id \
               AND EXISTS ( \
                   SELECT 1 FROM pageant_member_roles assignment \
                   INNER JOIN roles assigned_role ON assigned_role.id = assignment.role_id \
                   WHERE assignment.pageant_id = pageant.id AND assignment.user_id = $2 \
                     AND assignment.is_active = TRUE \
                     AND assigned_role.code = 'PAGEANT_COORDINATOR' \
                     AND assigned_role.scope = 'PAGEANT'::role_scope \
                     AND assigned_role.is_active = TRUE \
               ) \
             RETURNING {PAGEANT_COLUMNS}"
        );
        let row = sqlx::query_as::<_, PageantRow>(&query)
            .bind(pageant.id)
            .bind(coordinator_id)
            .bind(&pageant.name)
            .bind(&pageant.slug)
            .bind(&pageant.description)
            .bind(&pageant.logo_url)
            .bind(pageant.event_date)
            .bind(pageant.start_time)
            .bind(pageant.end_time)
            .bind(&pageant.venue)
            .bind(pageant.is_public)
            .fetch_optional(&self.pool)
            .await
            .map_err(map_pageant_write_error)?
            .ok_or_else(|| AppError::NotFound("assigned pageant".to_owned()))?;
        Ok(row.into())
    }
}

fn map_pageant_write_error(error: sqlx::Error) -> AppError {
    if let sqlx::Error::Database(database_error) = &error {
        if database_error.code().as_deref() == Some("23505")
            && database_error
                .constraint()
                .is_some_and(|constraint| constraint == "pageants_organization_id_slug_key")
        {
            return AppError::Conflict("a pageant with this slug already exists".to_owned());
        }
    }
    database_error(error)
}

fn database_error(error: sqlx::Error) -> AppError {
    AppError::Database(Box::new(error))
}
