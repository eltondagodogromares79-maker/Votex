use crate::{
    application::ports::public_catalog_workflow::PublicCatalogWorkflow,
    domain::public_catalog::{
        PublicContestant, PublicLegalPolicy, PublicPageant, PublicPageantDetails,
        PublicSubscriptionPlan,
    },
};
use async_trait::async_trait;
use core_infra::AppError;
use sqlx::PgPool;

pub struct PostgresPublicCatalogWorkflow {
    pool: PgPool,
}

impl PostgresPublicCatalogWorkflow {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl PublicCatalogWorkflow for PostgresPublicCatalogWorkflow {
    async fn list_public_pageants(&self) -> Result<Vec<PublicPageant>, AppError> {
        sqlx::query_as::<_, PublicPageant>(
            "SELECT pageant.id, pageant.name, pageant.slug::text AS slug, pageant.description, \
                    pageant.logo_url, pageant.event_date, pageant.venue, pageant.status::text AS status, \
                    (SELECT COUNT(*)::bigint FROM contestants contestant \
                     WHERE contestant.pageant_id = pageant.id AND contestant.is_active) AS contestant_count \
             FROM pageants pageant \
             WHERE pageant.is_public = TRUE \
               AND pageant.status NOT IN ('CANCELLED'::pageant_status, 'ARCHIVED'::pageant_status) \
             ORDER BY pageant.event_date NULLS LAST, pageant.name",
        )
        .fetch_all(&self.pool)
        .await
        .map_err(database_error)
    }

    async fn get_public_pageant(
        &self,
        slug: &str,
    ) -> Result<Option<PublicPageantDetails>, AppError> {
        let pageant = sqlx::query_as::<_, PublicPageant>(
            "SELECT pageant.id, pageant.name, pageant.slug::text AS slug, pageant.description, \
                    pageant.logo_url, pageant.event_date, pageant.venue, pageant.status::text AS status, \
                    (SELECT COUNT(*)::bigint FROM contestants contestant \
                     WHERE contestant.pageant_id = pageant.id AND contestant.is_active) AS contestant_count \
             FROM pageants pageant \
             WHERE pageant.slug = $1 AND pageant.is_public = TRUE \
               AND pageant.status NOT IN ('CANCELLED'::pageant_status, 'ARCHIVED'::pageant_status)",
        )
        .bind(slug)
        .fetch_optional(&self.pool)
        .await
        .map_err(database_error)?;

        let Some(pageant) = pageant else {
            return Ok(None);
        };

        let contestants = sqlx::query_as::<_, PublicContestant>(
            "SELECT id, contestant_number, display_name, gender, photo_url, biography \
             FROM contestants WHERE pageant_id = $1 AND is_active = TRUE \
             ORDER BY contestant_number, display_name",
        )
        .bind(pageant.id)
        .fetch_all(&self.pool)
        .await
        .map_err(database_error)?;

        Ok(Some(PublicPageantDetails {
            pageant,
            contestants,
        }))
    }

    async fn list_active_plans(&self) -> Result<Vec<PublicSubscriptionPlan>, AppError> {
        sqlx::query_as::<_, PublicSubscriptionPlan>(
            "SELECT id, code, name, kind::text AS kind, price_amount, currency::text AS currency, \
                    billing_interval_months, max_pageants, max_tabulator_users, max_judges_per_pageant, \
                    max_rounds_per_pageant, max_categories_per_round, public_voting_enabled, customization_enabled \
             FROM subscription_plans WHERE is_active = TRUE \
             ORDER BY CASE WHEN kind = 'CUSTOM'::subscription_plan_kind THEN 1 ELSE 0 END, \
                      price_amount, name",
        )
        .fetch_all(&self.pool)
        .await
        .map_err(database_error)
    }

    async fn get_legal_policy(&self, slug: &str) -> Result<Option<PublicLegalPolicy>, AppError> {
        sqlx::query_as::<_, PublicLegalPolicy>("SELECT slug, title, intro, body, version, updated_at FROM legal_policies WHERE slug = $1")
            .bind(slug).fetch_optional(&self.pool).await.map_err(database_error)
    }
}

fn database_error(error: sqlx::Error) -> AppError {
    AppError::Database(Box::new(error))
}
