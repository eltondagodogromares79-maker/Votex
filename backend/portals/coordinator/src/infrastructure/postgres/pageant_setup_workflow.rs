use async_trait::async_trait;
use chrono::{DateTime, Utc};
use core_infra::AppError;
use rust_decimal::Decimal;
use sqlx::{FromRow, PgPool};
use uuid::Uuid;

use crate::{
    application::ports::pageant_setup_workflow::PageantSetupWorkflow,
    domain::pageant_setup::{JudgingCriterion, PageantCategory},
};

pub struct PostgresPageantSetupWorkflow {
    pool: PgPool,
}

impl PostgresPageantSetupWorkflow {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[derive(FromRow)]
struct CategoryRow {
    id: Uuid,
    pageant_id: Uuid,
    code: String,
    name: String,
    description: Option<String>,
    display_order: i32,
    is_active: bool,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
}

impl From<CategoryRow> for PageantCategory {
    fn from(row: CategoryRow) -> Self {
        Self {
            id: row.id,
            pageant_id: row.pageant_id,
            code: row.code,
            name: row.name,
            description: row.description,
            display_order: row.display_order,
            is_active: row.is_active,
            created_at: row.created_at,
            updated_at: row.updated_at,
        }
    }
}

#[derive(FromRow)]
struct CriterionRow {
    id: Uuid,
    pageant_id: Uuid,
    code: String,
    name: String,
    description: Option<String>,
    default_maximum_score: Decimal,
    default_minimum_score: Decimal,
    is_active: bool,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
}

impl From<CriterionRow> for JudgingCriterion {
    fn from(row: CriterionRow) -> Self {
        Self {
            id: row.id,
            pageant_id: row.pageant_id,
            code: row.code,
            name: row.name,
            description: row.description,
            default_maximum_score: row.default_maximum_score,
            default_minimum_score: row.default_minimum_score,
            is_active: row.is_active,
            created_at: row.created_at,
            updated_at: row.updated_at,
        }
    }
}

const CATEGORY_COLUMNS: &str = "category.id, category.pageant_id, category.code, category.name, \
    category.description, category.display_order, category.is_active, category.created_at, \
    category.updated_at";
const CRITERION_COLUMNS: &str = "criterion.id, criterion.pageant_id, criterion.code, criterion.name, \
    criterion.description, criterion.default_maximum_score, criterion.default_minimum_score, \
    criterion.is_active, criterion.created_at, criterion.updated_at";

#[async_trait]
impl PageantSetupWorkflow for PostgresPageantSetupWorkflow {
    async fn list_categories(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
    ) -> Result<Vec<PageantCategory>, AppError> {
        ensure_coordinator(&self.pool, coordinator_id, pageant_id).await?;
        let query = format!(
            "SELECT {CATEGORY_COLUMNS} FROM pageant_categories category \
             WHERE category.pageant_id = $1 \
               AND EXISTS (SELECT 1 FROM pageant_member_roles assignment \
                   INNER JOIN roles assigned_role ON assigned_role.id = assignment.role_id \
                   WHERE assignment.pageant_id = $1 AND assignment.user_id = $2 \
                     AND assignment.is_active = TRUE AND assigned_role.code = 'PAGEANT_COORDINATOR' \
                     AND assigned_role.scope = 'PAGEANT'::role_scope AND assigned_role.is_active = TRUE) \
             ORDER BY category.display_order, category.name, category.id"
        );
        let rows = sqlx::query_as::<_, CategoryRow>(&query)
            .bind(pageant_id)
            .bind(coordinator_id)
            .fetch_all(&self.pool)
            .await
            .map_err(database_error)?;
        Ok(rows.into_iter().map(PageantCategory::from).collect())
    }

    async fn get_category(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
        category_id: Uuid,
    ) -> Result<PageantCategory, AppError> {
        ensure_coordinator(&self.pool, coordinator_id, pageant_id).await?;
        let query = format!(
            "SELECT {CATEGORY_COLUMNS} FROM pageant_categories category \
             WHERE category.pageant_id = $1 AND category.id = $2 \
               AND EXISTS (SELECT 1 FROM pageant_member_roles assignment \
                   INNER JOIN roles assigned_role ON assigned_role.id = assignment.role_id \
                   WHERE assignment.pageant_id = $1 AND assignment.user_id = $3 \
                     AND assignment.is_active = TRUE AND assigned_role.code = 'PAGEANT_COORDINATOR' \
                     AND assigned_role.scope = 'PAGEANT'::role_scope AND assigned_role.is_active = TRUE)"
        );
        sqlx::query_as::<_, CategoryRow>(&query)
            .bind(pageant_id)
            .bind(category_id)
            .bind(coordinator_id)
            .fetch_optional(&self.pool)
            .await
            .map_err(database_error)?
            .map(PageantCategory::from)
            .ok_or_else(|| AppError::NotFound("pageant category".to_owned()))
    }

    async fn create_category(
        &self,
        coordinator_id: Uuid,
        category: PageantCategory,
    ) -> Result<PageantCategory, AppError> {
        ensure_coordinator(&self.pool, coordinator_id, category.pageant_id).await?;
        let query = format!(
            "INSERT INTO pageant_categories AS category \
             (id, pageant_id, code, name, description, display_order) \
             SELECT $1, $2, $3, $4, $5, $6 \
             WHERE EXISTS (SELECT 1 FROM pageant_member_roles assignment \
                 INNER JOIN roles assigned_role ON assigned_role.id = assignment.role_id \
                 WHERE assignment.pageant_id = $2 AND assignment.user_id = $7 \
                   AND assignment.is_active = TRUE AND assigned_role.code = 'PAGEANT_COORDINATOR' \
                   AND assigned_role.scope = 'PAGEANT'::role_scope AND assigned_role.is_active = TRUE) \
             RETURNING {CATEGORY_COLUMNS}"
        );
        let row = sqlx::query_as::<_, CategoryRow>(&query)
            .bind(category.id)
            .bind(category.pageant_id)
            .bind(&category.code)
            .bind(&category.name)
            .bind(&category.description)
            .bind(category.display_order)
            .bind(coordinator_id)
            .fetch_optional(&self.pool)
            .await
            .map_err(map_category_error)?
            .ok_or(AppError::Forbidden)?;
        Ok(row.into())
    }

    async fn update_category(
        &self,
        coordinator_id: Uuid,
        category: PageantCategory,
    ) -> Result<PageantCategory, AppError> {
        ensure_coordinator(&self.pool, coordinator_id, category.pageant_id).await?;
        let query = format!(
            "UPDATE pageant_categories category SET code = $3, name = $4, \
             description = $5, display_order = $6 \
             WHERE category.pageant_id = $1 AND category.id = $2 \
               AND EXISTS (SELECT 1 FROM pageant_member_roles assignment \
                   INNER JOIN roles assigned_role ON assigned_role.id = assignment.role_id \
                   WHERE assignment.pageant_id = $1 AND assignment.user_id = $7 \
                     AND assignment.is_active = TRUE AND assigned_role.code = 'PAGEANT_COORDINATOR' \
                     AND assigned_role.scope = 'PAGEANT'::role_scope AND assigned_role.is_active = TRUE) \
             RETURNING {CATEGORY_COLUMNS}"
        );
        let row = sqlx::query_as::<_, CategoryRow>(&query)
            .bind(category.pageant_id)
            .bind(category.id)
            .bind(&category.code)
            .bind(&category.name)
            .bind(&category.description)
            .bind(category.display_order)
            .bind(coordinator_id)
            .fetch_optional(&self.pool)
            .await
            .map_err(map_category_error)?
            .ok_or_else(|| AppError::NotFound("pageant category".to_owned()))?;
        Ok(row.into())
    }

    async fn deactivate_category(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
        category_id: Uuid,
    ) -> Result<(), AppError> {
        ensure_coordinator(&self.pool, coordinator_id, pageant_id).await?;
        let changed = sqlx::query_scalar::<_, Uuid>(
            r#"
            UPDATE pageant_categories category SET is_active = FALSE
            WHERE category.pageant_id = $1 AND category.id = $2 AND category.is_active = TRUE
              AND EXISTS (
                  SELECT 1 FROM pageant_member_roles assignment
                  INNER JOIN roles assigned_role ON assigned_role.id = assignment.role_id
                  WHERE assignment.pageant_id = $1 AND assignment.user_id = $3
                    AND assignment.is_active = TRUE AND assigned_role.code = 'PAGEANT_COORDINATOR'
                    AND assigned_role.scope = 'PAGEANT'::role_scope AND assigned_role.is_active = TRUE
              )
            RETURNING category.id
            "#,
        )
        .bind(pageant_id)
        .bind(category_id)
        .bind(coordinator_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(database_error)?;
        changed
            .map(|_| ())
            .ok_or_else(|| AppError::NotFound("active pageant category".to_owned()))
    }

    async fn list_criteria(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
    ) -> Result<Vec<JudgingCriterion>, AppError> {
        ensure_coordinator(&self.pool, coordinator_id, pageant_id).await?;
        let query = format!(
            "SELECT {CRITERION_COLUMNS} FROM criteria criterion \
             WHERE criterion.pageant_id = $1 \
               AND EXISTS (SELECT 1 FROM pageant_member_roles assignment \
                   INNER JOIN roles assigned_role ON assigned_role.id = assignment.role_id \
                   WHERE assignment.pageant_id = $1 AND assignment.user_id = $2 \
                     AND assignment.is_active = TRUE AND assigned_role.code = 'PAGEANT_COORDINATOR' \
                     AND assigned_role.scope = 'PAGEANT'::role_scope AND assigned_role.is_active = TRUE) \
             ORDER BY criterion.name, criterion.code, criterion.id"
        );
        let rows = sqlx::query_as::<_, CriterionRow>(&query)
            .bind(pageant_id)
            .bind(coordinator_id)
            .fetch_all(&self.pool)
            .await
            .map_err(database_error)?;
        Ok(rows.into_iter().map(JudgingCriterion::from).collect())
    }

    async fn get_criterion(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
        criterion_id: Uuid,
    ) -> Result<JudgingCriterion, AppError> {
        ensure_coordinator(&self.pool, coordinator_id, pageant_id).await?;
        let query = format!(
            "SELECT {CRITERION_COLUMNS} FROM criteria criterion \
             WHERE criterion.pageant_id = $1 AND criterion.id = $2 \
               AND EXISTS (SELECT 1 FROM pageant_member_roles assignment \
                   INNER JOIN roles assigned_role ON assigned_role.id = assignment.role_id \
                   WHERE assignment.pageant_id = $1 AND assignment.user_id = $3 \
                     AND assignment.is_active = TRUE AND assigned_role.code = 'PAGEANT_COORDINATOR' \
                     AND assigned_role.scope = 'PAGEANT'::role_scope AND assigned_role.is_active = TRUE)"
        );
        sqlx::query_as::<_, CriterionRow>(&query)
            .bind(pageant_id)
            .bind(criterion_id)
            .bind(coordinator_id)
            .fetch_optional(&self.pool)
            .await
            .map_err(database_error)?
            .map(JudgingCriterion::from)
            .ok_or_else(|| AppError::NotFound("judging criterion".to_owned()))
    }

    async fn create_criterion(
        &self,
        coordinator_id: Uuid,
        criterion: JudgingCriterion,
    ) -> Result<JudgingCriterion, AppError> {
        ensure_coordinator(&self.pool, coordinator_id, criterion.pageant_id).await?;
        let query = format!(
            "INSERT INTO criteria AS criterion \
             (id, pageant_id, code, name, description, default_maximum_score, default_minimum_score) \
             SELECT $1, $2, $3, $4, $5, $6, $7 \
             WHERE EXISTS (SELECT 1 FROM pageant_member_roles assignment \
                 INNER JOIN roles assigned_role ON assigned_role.id = assignment.role_id \
                 WHERE assignment.pageant_id = $2 AND assignment.user_id = $8 \
                   AND assignment.is_active = TRUE AND assigned_role.code = 'PAGEANT_COORDINATOR' \
                   AND assigned_role.scope = 'PAGEANT'::role_scope AND assigned_role.is_active = TRUE) \
             RETURNING {CRITERION_COLUMNS}"
        );
        let row = sqlx::query_as::<_, CriterionRow>(&query)
            .bind(criterion.id)
            .bind(criterion.pageant_id)
            .bind(&criterion.code)
            .bind(&criterion.name)
            .bind(&criterion.description)
            .bind(criterion.default_maximum_score)
            .bind(criterion.default_minimum_score)
            .bind(coordinator_id)
            .fetch_optional(&self.pool)
            .await
            .map_err(map_criterion_error)?
            .ok_or(AppError::Forbidden)?;
        Ok(row.into())
    }

    async fn update_criterion(
        &self,
        coordinator_id: Uuid,
        criterion: JudgingCriterion,
    ) -> Result<JudgingCriterion, AppError> {
        ensure_coordinator(&self.pool, coordinator_id, criterion.pageant_id).await?;
        let query = format!(
            "UPDATE criteria criterion SET code = $3, name = $4, description = $5, \
             default_maximum_score = $6, default_minimum_score = $7 \
             WHERE criterion.pageant_id = $1 AND criterion.id = $2 \
               AND EXISTS (SELECT 1 FROM pageant_member_roles assignment \
                   INNER JOIN roles assigned_role ON assigned_role.id = assignment.role_id \
                   WHERE assignment.pageant_id = $1 AND assignment.user_id = $8 \
                     AND assignment.is_active = TRUE AND assigned_role.code = 'PAGEANT_COORDINATOR' \
                     AND assigned_role.scope = 'PAGEANT'::role_scope AND assigned_role.is_active = TRUE) \
             RETURNING {CRITERION_COLUMNS}"
        );
        let row = sqlx::query_as::<_, CriterionRow>(&query)
            .bind(criterion.pageant_id)
            .bind(criterion.id)
            .bind(&criterion.code)
            .bind(&criterion.name)
            .bind(&criterion.description)
            .bind(criterion.default_maximum_score)
            .bind(criterion.default_minimum_score)
            .bind(coordinator_id)
            .fetch_optional(&self.pool)
            .await
            .map_err(map_criterion_error)?
            .ok_or_else(|| AppError::NotFound("judging criterion".to_owned()))?;
        Ok(row.into())
    }

    async fn deactivate_criterion(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
        criterion_id: Uuid,
    ) -> Result<(), AppError> {
        ensure_coordinator(&self.pool, coordinator_id, pageant_id).await?;
        let changed = sqlx::query_scalar::<_, Uuid>(
            r#"
            UPDATE criteria criterion SET is_active = FALSE
            WHERE criterion.pageant_id = $1 AND criterion.id = $2 AND criterion.is_active = TRUE
              AND EXISTS (
                  SELECT 1 FROM pageant_member_roles assignment
                  INNER JOIN roles assigned_role ON assigned_role.id = assignment.role_id
                  WHERE assignment.pageant_id = $1 AND assignment.user_id = $3
                    AND assignment.is_active = TRUE AND assigned_role.code = 'PAGEANT_COORDINATOR'
                    AND assigned_role.scope = 'PAGEANT'::role_scope AND assigned_role.is_active = TRUE
              )
            RETURNING criterion.id
            "#,
        )
        .bind(pageant_id)
        .bind(criterion_id)
        .bind(coordinator_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(database_error)?;
        changed
            .map(|_| ())
            .ok_or_else(|| AppError::NotFound("active judging criterion".to_owned()))
    }
}

async fn ensure_coordinator(
    pool: &PgPool,
    coordinator_id: Uuid,
    pageant_id: Uuid,
) -> Result<(), AppError> {
    let assigned = sqlx::query_scalar::<_, bool>(
        r#"
        SELECT EXISTS (
            SELECT 1
            FROM pageant_member_roles assignment
            INNER JOIN roles assigned_role ON assigned_role.id = assignment.role_id
            WHERE assignment.pageant_id = $1 AND assignment.user_id = $2
              AND assignment.is_active = TRUE
              AND assigned_role.code = 'PAGEANT_COORDINATOR'
              AND assigned_role.scope = 'PAGEANT'::role_scope
              AND assigned_role.is_active = TRUE
        )
        "#,
    )
    .bind(pageant_id)
    .bind(coordinator_id)
    .fetch_one(pool)
    .await
    .map_err(database_error)?;
    if assigned {
        Ok(())
    } else {
        Err(AppError::Forbidden)
    }
}

fn map_category_error(error: sqlx::Error) -> AppError {
    if let sqlx::Error::Database(database_error) = &error {
        if database_error.code().as_deref() == Some("23505") {
            let constraint = database_error.constraint().unwrap_or_default();
            if constraint == "pageant_categories_pageant_id_code_key" {
                return AppError::Conflict(
                    "category code already exists for this pageant".to_owned(),
                );
            }
            if constraint == "pageant_categories_pageant_id_name_key" {
                return AppError::Conflict(
                    "category name already exists for this pageant".to_owned(),
                );
            }
        }
    }
    database_error(error)
}

fn map_criterion_error(error: sqlx::Error) -> AppError {
    if let sqlx::Error::Database(database_error) = &error {
        if database_error.code().as_deref() == Some("23505")
            && database_error
                .constraint()
                .is_some_and(|constraint| constraint == "criteria_pageant_id_code_key")
        {
            return AppError::Conflict("criterion code already exists for this pageant".to_owned());
        }
    }
    database_error(error)
}

fn database_error(error: sqlx::Error) -> AppError {
    AppError::Database(Box::new(error))
}
