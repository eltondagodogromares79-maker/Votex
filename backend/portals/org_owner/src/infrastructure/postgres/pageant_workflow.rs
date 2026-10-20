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

        let organization =
            sqlx::query_scalar::<_, Uuid>("SELECT id FROM organizations WHERE id = $1 FOR UPDATE")
                .bind(pageant.organization_id)
                .fetch_optional(&mut *transaction)
                .await
                .map_err(database_error)?
                .ok_or_else(|| AppError::NotFound("organization".to_owned()))?;
        let max_pageants = sqlx::query_scalar::<_, Option<i32>>(
            "SELECT plan.max_pageants FROM organization_subscriptions subscription \
             INNER JOIN subscription_plans plan ON plan.id = subscription.plan_id \
             WHERE subscription.organization_id = $1 \
               AND subscription.status IN ('TRIALING','ACTIVE','PAST_DUE','PAUSED') \
             ORDER BY subscription.created_at DESC, subscription.id DESC LIMIT 1",
        )
        .bind(organization)
        .fetch_optional(&mut *transaction)
        .await
        .map_err(database_error)?
        .ok_or_else(|| AppError::BadRequest(
            "Your organization does not have an active subscription. Please subscribe to a plan before creating a pageant.".to_owned(),
        ))?;
        if let Some(max) = max_pageants {
            let current_count = sqlx::query_scalar::<_, i64>(
                "SELECT COUNT(*) FROM pageants WHERE organization_id = $1 \
                 AND (status <> 'ARCHIVED'::pageant_status OR configuration_started_at IS NOT NULL)",
            )
            .bind(organization)
            .fetch_one(&mut *transaction)
            .await
            .map_err(database_error)?;
            if current_count >= i64::from(max) {
                return Err(AppError::BadRequest(format!(
                    "Your current plan allows a maximum of {max} pageant{}. You have reached this limit. Please upgrade your plan to create more pageants.",
                    if max == 1 { "" } else { "s" },
                )));
            }
        }

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
            .bind(&pageant.venue)
            .bind(pageant.is_public)
            .fetch_optional(&self.pool)
            .await
            .map_err(map_pageant_write_error)?
            .ok_or_else(|| AppError::NotFound("pageant".to_owned()))?;
        Ok(row.into())
    }

    async fn publish_pageant(
        &self,
        organization_id: Uuid,
        pageant_id: Uuid,
    ) -> Result<Pageant, AppError> {
        let query = format!(
            "UPDATE pageants SET status = 'PUBLISHED'::pageant_status \
             WHERE organization_id = $1 AND id = $2 AND status = 'DRAFT'::pageant_status \
             RETURNING {PAGEANT_COLUMNS}"
        );
        sqlx::query_as::<_, PageantRow>(&query)
            .bind(organization_id)
            .bind(pageant_id)
            .fetch_optional(&self.pool)
            .await
            .map_err(database_error)?
            .map(Pageant::from)
            .ok_or_else(|| AppError::Conflict("pageant is no longer a draft".to_owned()))
    }

    async fn archive_pageant(
        &self,
        organization_id: Uuid,
        pageant_id: Uuid,
    ) -> Result<(), AppError> {
        let mut transaction = self.pool.begin().await.map_err(database_error)?;
        let configured_at = sqlx::query_scalar::<_, Option<chrono::DateTime<chrono::Utc>>>(
            "SELECT configuration_started_at FROM pageants \
             WHERE organization_id = $1 AND id = $2 FOR UPDATE",
        )
        .bind(organization_id)
        .bind(pageant_id)
        .fetch_optional(&mut *transaction)
        .await
        .map_err(database_error)?
        .ok_or_else(|| AppError::NotFound("pageant".to_owned()))?;

        if configured_at.is_some() {
            return Err(AppError::Conflict(
                "This pageant has already been configured and cannot be deleted. Its plan limit remains in use.".to_owned(),
            ));
        }

        sqlx::query("UPDATE pageants SET status = 'ARCHIVED'::pageant_status WHERE id = $1")
            .bind(pageant_id)
            .execute(&mut *transaction)
            .await
            .map_err(database_error)?;
        transaction.commit().await.map_err(database_error)
    }

    async fn restore_pageant(
        &self,
        organization_id: Uuid,
        pageant_id: Uuid,
    ) -> Result<(), AppError> {
        let mut transaction = self.pool.begin().await.map_err(database_error)?;
        sqlx::query_scalar::<_, Uuid>("SELECT id FROM organizations WHERE id = $1 FOR UPDATE")
            .bind(organization_id)
            .fetch_optional(&mut *transaction)
            .await
            .map_err(database_error)?
            .ok_or_else(|| AppError::NotFound("organization".to_owned()))?;

        let configuration_started_at = sqlx::query_scalar::<_, Option<chrono::DateTime<chrono::Utc>>>(
            "SELECT configuration_started_at FROM pageants WHERE organization_id = $1 AND id = $2 AND status = 'ARCHIVED'::pageant_status FOR UPDATE",
        )
        .bind(organization_id)
        .bind(pageant_id)
        .fetch_optional(&mut *transaction)
        .await
        .map_err(database_error)?
        .ok_or_else(|| AppError::NotFound("archived pageant".to_owned()))?;

        if configuration_started_at.is_some() {
            return Err(AppError::Conflict(
                "configured pageants cannot be restored after archival".to_owned(),
            ));
        }

        let max_pageants = sqlx::query_scalar::<_, Option<i32>>(
            "SELECT plan.max_pageants FROM organization_subscriptions subscription \
             INNER JOIN subscription_plans plan ON plan.id = subscription.plan_id \
             WHERE subscription.organization_id = $1 \
               AND subscription.status IN ('TRIALING','ACTIVE','PAST_DUE','PAUSED') \
             ORDER BY subscription.created_at DESC, subscription.id DESC LIMIT 1",
        )
        .bind(organization_id)
        .fetch_optional(&mut *transaction)
        .await
        .map_err(database_error)?
        .ok_or_else(|| {
            AppError::BadRequest(
                "an active subscription is required to restore this pageant".to_owned(),
            )
        })?;

        if let Some(limit) = max_pageants {
            let used = sqlx::query_scalar::<_, i64>(
                "SELECT COUNT(*) FROM pageants WHERE organization_id = $1 AND (status <> 'ARCHIVED'::pageant_status OR configuration_started_at IS NOT NULL)",
            )
            .bind(organization_id)
            .fetch_one(&mut *transaction)
            .await
            .map_err(database_error)?;
            if used >= i64::from(limit) {
                return Err(AppError::Conflict(format!(
                    "restoring this pageant would exceed your plan limit of {limit}"
                )));
            }
        }

        sqlx::query("UPDATE pageants SET status = 'DRAFT'::pageant_status WHERE id = $1 AND organization_id = $2 AND status = 'ARCHIVED'::pageant_status")
            .bind(pageant_id)
            .bind(organization_id)
            .execute(&mut *transaction)
            .await
            .map_err(database_error)?;
        transaction.commit().await.map_err(database_error)
    }

    async fn count_active_pageants(&self, organization_id: Uuid) -> Result<i64, AppError> {
        sqlx::query_scalar::<_, i64>(
            "SELECT COUNT(*) FROM pageants \
             WHERE organization_id = $1 \
               AND (status <> 'ARCHIVED'::pageant_status OR configuration_started_at IS NOT NULL)",
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
