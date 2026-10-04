use async_trait::async_trait;
use chrono::{NaiveDate, NaiveTime};
use core_infra::AppError;
use sqlx::{FromRow, PgPool};
use uuid::Uuid;

use crate::{application::ports::pageant_workflow::PageantWorkflow, domain::pageant::Pageant};

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

impl From<PageantRow> for Pageant {
    fn from(row: PageantRow) -> Self {
        Self {
            id: row.id,
            organization_id: row.organization_id,
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

const PAGEANT_COLUMNS: &str = r#"
    id, organization_id, created_by, name, slug, description, logo_url,
    event_date, start_time, end_time, venue, status::text AS status, is_public
"#;

#[async_trait]
impl PageantWorkflow for PostgresPageantWorkflow {
    async fn create_pageant(&self, pageant: Pageant) -> Result<Pageant, AppError> {
        let mut transaction = self.pool.begin().await.map_err(database_error)?;

        let inserted = sqlx::query(
            r#"
            INSERT INTO pageants (
                id, organization_id, created_by, name, slug, description,
                logo_url, event_date, start_time, end_time, venue, status, is_public
            )
            VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
                'DRAFT'::pageant_status, $12
            )
            "#,
        )
        .bind(pageant.id)
        .bind(pageant.organization_id)
        .bind(pageant.created_by)
        .bind(&pageant.name)
        .bind(&pageant.slug)
        .bind(&pageant.description)
        .bind(&pageant.logo_url)
        .bind(pageant.event_date)
        .bind(pageant.start_time)
        .bind(pageant.end_time)
        .bind(&pageant.venue)
        .bind(pageant.is_public)
        .execute(&mut *transaction)
        .await;

        if let Err(error) = inserted {
            return Err(map_pageant_write_error(error));
        }

        sqlx::query("INSERT INTO pageant_settings (pageant_id) VALUES ($1)")
            .bind(pageant.id)
            .execute(&mut *transaction)
            .await
            .map_err(database_error)?;

        transaction.commit().await.map_err(database_error)?;
        Ok(pageant)
    }

    async fn list_pageants(&self, organization_id: Uuid) -> Result<Vec<Pageant>, AppError> {
        let query = format!(
            "SELECT {PAGEANT_COLUMNS} FROM pageants \
             WHERE organization_id = $1 ORDER BY created_at DESC, id"
        );
        let rows = sqlx::query_as::<_, PageantRow>(&query)
            .bind(organization_id)
            .fetch_all(&self.pool)
            .await
            .map_err(database_error)?;
        Ok(rows.into_iter().map(Pageant::from).collect())
    }

    async fn get_pageant(
        &self,
        organization_id: Uuid,
        pageant_id: Uuid,
    ) -> Result<Pageant, AppError> {
        let query = format!(
            "SELECT {PAGEANT_COLUMNS} FROM pageants \
             WHERE organization_id = $1 AND id = $2"
        );
        sqlx::query_as::<_, PageantRow>(&query)
            .bind(organization_id)
            .bind(pageant_id)
            .fetch_optional(&self.pool)
            .await
            .map_err(database_error)?
            .map(Pageant::from)
            .ok_or_else(|| AppError::NotFound("pageant".to_owned()))
    }

    async fn update_pageant(&self, pageant: Pageant) -> Result<Pageant, AppError> {
        let query = format!(
            "UPDATE pageants SET name = $3, slug = $4, description = $5, \
             logo_url = $6, event_date = $7, start_time = $8, end_time = $9, \
             venue = $10, is_public = $11 \
             WHERE organization_id = $1 AND id = $2 AND status <> 'ARCHIVED'::pageant_status \
             RETURNING {PAGEANT_COLUMNS}"
        );
        let row = sqlx::query_as::<_, PageantRow>(&query)
            .bind(pageant.organization_id)
            .bind(pageant.id)
            .bind(&pageant.name)
            .bind(&pageant.slug)
            .bind(&pageant.description)
            .bind(&pageant.logo_url)
            .bind(pageant.event_date)
            .bind(pageant.start_time)
            .bind(pageant.end_time)
            .bind(pageant.is_public)
            .fetch_optional(&self.pool)
            .await
            .map_err(map_pageant_write_error)?
            .ok_or_else(|| AppError::NotFound("pageant".to_owned()))?;
        Ok(row.into())
    }

    async fn archive_pageant(
        &self,
        organization_id: Uuid,
        pageant_id: Uuid,
    ) -> Result<(), AppError> {
        let archived = sqlx::query_scalar::<_, Uuid>(
            r#"
            UPDATE pageants
            SET status = 'ARCHIVED'::pageant_status
            WHERE organization_id = $1 AND id = $2
            RETURNING id
            "#,
        )
        .bind(organization_id)
        .bind(pageant_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(database_error)?;
        if archived.is_some() {
            return Ok(());
        }

        let exists = sqlx::query_scalar::<_, bool>(
            "SELECT EXISTS (SELECT 1 FROM pageants WHERE organization_id = $1 AND id = $2)",
        )
        .bind(organization_id)
        .bind(pageant_id)
        .fetch_one(&self.pool)
        .await
        .map_err(database_error)?;
        if exists {
            Ok(())
        } else {
            Err(AppError::NotFound("pageant".to_owned()))
        }
    }

    async fn count_active_pageants(&self, organization_id: Uuid) -> Result<i64, AppError> {
        sqlx::query_scalar::<_, i64>(
            "SELECT COUNT(*) FROM pageants \
             WHERE organization_id = $1 AND status <> 'ARCHIVED'::pageant_status",
        )
        .bind(organization_id)
        .fetch_one(&self.pool)
        .await
        .map_err(database_error)
    }
}

fn database_error(error: sqlx::Error) -> AppError {
    AppError::Database(Box::new(error))
}

fn map_pageant_write_error(error: sqlx::Error) -> AppError {
    if let sqlx::Error::Database(database_error) = &error {
        if database_error.code().as_deref() == Some("23505")
            && database_error
                .constraint()
                .is_some_and(|constraint| constraint == "pageants_organization_id_slug_key")
        {
            return AppError::SlugTaken;
        }
    }
    database_error(error)
}
