use async_trait::async_trait;
use chrono::{NaiveDate, NaiveTime};
use core_infra::AppError;
use sqlx::{FromRow, PgPool};
use uuid::Uuid;

use crate::{
    application::ports::pageant_workflow::PageantWorkflow,
    domain::pageant::{AssignedPageant, PageantResourceLimits, RoundCategoryUsage},
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

    async fn get_resource_limits(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
    ) -> Result<PageantResourceLimits, AppError> {
        #[derive(FromRow)]
        struct LimitsRow {
            has_active_subscription: bool,
            max_judges_per_pageant: Option<i32>,
            max_tabulator_users: Option<i32>,
            max_rounds_per_pageant: Option<i32>,
            max_categories_per_round: Option<i32>,
            judges_used: i64,
            tabulators_used: i64,
            rounds_used: i64,
            categories_used: i64,
        }

        let row = sqlx::query_as::<_, LimitsRow>(
            r#"
            SELECT (plan.id IS NOT NULL) AS has_active_subscription,
                   plan.max_judges_per_pageant,
                   plan.max_tabulator_users,
                   plan.max_rounds_per_pageant,
                   plan.max_categories_per_round,
                   (SELECT COUNT(DISTINCT assignment.user_id)
                    FROM pageant_member_roles assignment
                    JOIN roles role ON role.id = assignment.role_id
                    WHERE assignment.pageant_id = pageant.id
                      AND assignment.is_active = TRUE
                      AND role.code = 'PAGEANT_JUDGE'
                      AND role.scope = 'PAGEANT'::role_scope
                      AND role.is_active = TRUE) AS judges_used,
                   (SELECT COUNT(DISTINCT assignment.user_id)
                    FROM pageant_member_roles assignment
                    JOIN roles role ON role.id = assignment.role_id
                    JOIN pageants staff_pageant ON staff_pageant.id = assignment.pageant_id
                    WHERE staff_pageant.organization_id = pageant.organization_id
                      AND staff_pageant.status <> 'ARCHIVED'::pageant_status
                      AND assignment.is_active = TRUE
                      AND role.code = 'PAGEANT_TABULATOR'
                      AND role.scope = 'PAGEANT'::role_scope
                      AND role.is_active = TRUE) AS tabulators_used,
                   (SELECT COUNT(*) FROM pageant_rounds round WHERE round.pageant_id = pageant.id) AS rounds_used,
                   (SELECT COUNT(*) FROM pageant_categories category
                    WHERE category.pageant_id = pageant.id AND category.is_active = TRUE) AS categories_used
            FROM pageants pageant
            JOIN pageant_member_roles assignment ON assignment.pageant_id = pageant.id
            JOIN roles assigned_role ON assigned_role.id = assignment.role_id
            LEFT JOIN LATERAL (
                SELECT plan.id, plan.max_judges_per_pageant, plan.max_tabulator_users,
                       plan.max_rounds_per_pageant, plan.max_categories_per_round
                FROM organization_subscriptions subscription
                JOIN subscription_plans plan ON plan.id = subscription.plan_id
                WHERE subscription.organization_id = pageant.organization_id
                  AND subscription.status IN ('TRIALING', 'ACTIVE', 'PAST_DUE', 'PAUSED')
                ORDER BY subscription.created_at DESC, subscription.id DESC
                LIMIT 1
            ) plan ON TRUE
            WHERE pageant.id = $1
              AND assignment.user_id = $2
              AND assignment.is_active = TRUE
              AND assigned_role.code = 'PAGEANT_COORDINATOR'
              AND assigned_role.scope = 'PAGEANT'::role_scope
              AND assigned_role.is_active = TRUE
            LIMIT 1
            "#,
        )
        .bind(pageant_id)
        .bind(coordinator_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(database_error)?
        .ok_or_else(|| AppError::NotFound("assigned pageant".to_owned()))?;

        let round_categories = sqlx::query_as::<_, (Uuid, String, i64)>(
            "SELECT round.id, round.name, COUNT(category.id) FILTER (WHERE category.is_active = TRUE) AS categories_used \
             FROM pageant_rounds round \
             LEFT JOIN pageant_round_categories round_category ON round_category.round_id = round.id \
             LEFT JOIN pageant_categories category ON category.id = round_category.category_id \
             WHERE round.pageant_id = $1 \
             GROUP BY round.id, round.name, round.round_number \
             ORDER BY round.round_number, round.id",
        )
        .bind(pageant_id)
        .fetch_all(&self.pool)
        .await
        .map_err(database_error)?
        .into_iter()
        .map(|(round_id, round_name, categories_used)| RoundCategoryUsage {
            round_id,
            round_name,
            categories_used,
        })
        .collect();

        Ok(PageantResourceLimits {
            has_active_subscription: row.has_active_subscription,
            max_judges_per_pageant: row.max_judges_per_pageant,
            max_tabulator_users: row.max_tabulator_users,
            max_rounds_per_pageant: row.max_rounds_per_pageant,
            max_categories_per_round: row.max_categories_per_round,
            judges_used: row.judges_used,
            tabulators_used: row.tabulators_used,
            rounds_used: row.rounds_used,
            categories_used: row.categories_used,
            round_categories,
        })
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
