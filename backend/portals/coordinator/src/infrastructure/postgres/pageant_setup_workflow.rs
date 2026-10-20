use async_trait::async_trait;
use chrono::{DateTime, Utc};
use core_infra::AppError;
use rust_decimal::Decimal;
use sqlx::{FromRow, PgPool};
use uuid::Uuid;

use crate::{
    application::ports::pageant_setup_workflow::PageantSetupWorkflow,
    domain::pageant_setup::{JudgingCriterion, LeaderboardEntry, PageantCategory},
    infrastructure::postgres::entitlements::{
        ensure_below_limit, ensure_within_limit, lock_org_and_get_limits,
    },
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
    eligibility_scope: String,
    eligibility_notes: Option<String>,
    is_active: bool,
    status: String,
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
            eligibility_scope: row.eligibility_scope,
            eligibility_notes: row.eligibility_notes,
            is_active: row.is_active,
            status: row.status,
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

#[derive(FromRow)]
struct LeaderboardRow {
    contestant_id: Uuid,
    contestant_number: i32,
    contestant_name: String,
    gender: Option<String>,
    photo_url: Option<String>,
    category_id: Option<Uuid>,
    category_name: Option<String>,
    eligibility_scope: Option<String>,
    category_weight: Option<Decimal>,
    score: Option<Decimal>,
    submitted_judges: Option<i64>,
}

impl From<LeaderboardRow> for LeaderboardEntry {
    fn from(row: LeaderboardRow) -> Self {
        Self {
            contestant_id: row.contestant_id,
            contestant_number: row.contestant_number,
            contestant_name: row.contestant_name,
            gender: row.gender,
            photo_url: row.photo_url,
            category_id: row.category_id,
            category_name: row.category_name,
            eligibility_scope: row.eligibility_scope,
            category_weight: row.category_weight,
            score: row.score,
            submitted_judges: row.submitted_judges.unwrap_or(0),
        }
    }
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
    category.description, category.display_order, category.eligibility_scope, category.eligibility_notes, category.is_active, category.status, category.created_at, \
    category.updated_at";
const CRITERION_COLUMNS: &str = "criterion.id, criterion.pageant_id, criterion.code, criterion.name, \
    criterion.description, criterion.default_maximum_score, criterion.default_minimum_score, \
    criterion.is_active, criterion.created_at, criterion.updated_at";

#[async_trait]
impl PageantSetupWorkflow for PostgresPageantSetupWorkflow {
    async fn get_leaderboard(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
        round_id: Uuid,
    ) -> Result<Vec<LeaderboardEntry>, AppError> {
        ensure_coordinator(&self.pool, coordinator_id, pageant_id).await?;
        let rows = sqlx::query_as::<_, LeaderboardRow>(r#"
            WITH configured AS (
                SELECT rc.category_id, COUNT(DISTINCT rc.id)::BIGINT AS criteria_count
                FROM round_criteria rc
                WHERE rc.round_id = $2 AND rc.category_id IS NOT NULL
                GROUP BY rc.category_id
            ), sheet_category_scores AS (
                SELECT ss.id AS score_sheet_id, ss.contestant_id, rc.category_id,
                       COUNT(DISTINCT rc.id)::BIGINT AS scored_count,
                       SUM(
                           CASE WHEN rc.maximum_score = rc.minimum_score THEN 100::NUMERIC
                           ELSE LEAST(100::NUMERIC, GREATEST(0::NUMERIC,
                               (js.raw_score - rc.minimum_score) * 100 / NULLIF(rc.maximum_score - rc.minimum_score, 0)))
                           END * rc.weight_percentage / 100
                       ) AS category_score
                FROM score_sheets ss
                INNER JOIN judge_assignments ja ON ja.id = ss.judge_assignment_id
                INNER JOIN judge_scores js ON js.score_sheet_id = ss.id
                INNER JOIN round_criteria rc ON rc.id = js.round_criterion_id AND rc.round_id = ja.round_id
                WHERE ja.pageant_id = $1 AND ja.round_id = $2 AND ja.status = 'ACTIVE'
                  AND ss.status IN ('SUBMITTED', 'LOCKED') AND rc.category_id IS NOT NULL
                GROUP BY ss.id, ss.contestant_id, rc.category_id
            ), complete_sheet_scores AS (
                SELECT scs.contestant_id, scs.category_id, scs.category_score
                FROM sheet_category_scores scs
                INNER JOIN configured cfg ON cfg.category_id = scs.category_id
                WHERE scs.scored_count = cfg.criteria_count
            ), category_scores AS (
                SELECT contestant_id, category_id, AVG(category_score) AS score,
                       COUNT(*)::BIGINT AS submitted_judges
                FROM complete_sheet_scores
                GROUP BY contestant_id, category_id
            )
            SELECT c.id AS contestant_id, c.contestant_number, c.display_name AS contestant_name,
                   c.gender, c.photo_url, cat.category_id, cat.name AS category_name,
                   cat.eligibility_scope, cat.weight_percentage AS category_weight,
                   cs.score, cs.submitted_judges
            FROM contestants c
            LEFT JOIN LATERAL (
                SELECT prc.category_id, prc.weight_percentage, cat.name, cat.eligibility_scope, cat.display_order
                FROM pageant_round_categories prc
                INNER JOIN pageant_categories cat ON cat.id = prc.category_id AND cat.is_active = TRUE
                WHERE prc.round_id = $2 AND prc.pageant_id = $1
                  AND (cat.eligibility_scope = 'OPEN'
                       OR (cat.eligibility_scope = 'MEN' AND LOWER(COALESCE(c.gender, '')) = 'male')
                       OR (cat.eligibility_scope IN ('WOMEN', 'LGBTQ_PLUS') AND LOWER(COALESCE(c.gender, '')) <> 'male')
                       OR cat.eligibility_scope = 'CUSTOM')
            ) cat ON TRUE
            LEFT JOIN category_scores cs ON cs.contestant_id = c.id AND cs.category_id = cat.category_id
            WHERE c.pageant_id = $1 AND c.is_active = TRUE
              AND EXISTS (SELECT 1 FROM pageant_rounds r WHERE r.id = $2 AND r.pageant_id = $1)
            ORDER BY CASE WHEN LOWER(COALESCE(c.gender, '')) = 'male' THEN 1 ELSE 0 END,
                     c.contestant_number, cat.display_order NULLS FIRST, cat.name NULLS FIRST
        "#)
        .bind(pageant_id).bind(round_id).fetch_all(&self.pool).await.map_err(database_error)?;
        if !sqlx::query_scalar::<_, bool>(
            "SELECT EXISTS (SELECT 1 FROM pageant_rounds WHERE id = $1 AND pageant_id = $2)",
        )
        .bind(round_id)
        .bind(pageant_id)
        .fetch_one(&self.pool)
        .await
        .map_err(database_error)?
        {
            return Err(AppError::NotFound("pageant round".to_owned()));
        }
        Ok(rows.into_iter().map(LeaderboardEntry::from).collect())
    }

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
        round_id: Option<Uuid>,
        category: PageantCategory,
    ) -> Result<PageantCategory, AppError> {
        ensure_coordinator(&self.pool, coordinator_id, category.pageant_id).await?;
        let mut transaction = self.pool.begin().await.map_err(database_error)?;
        let limits =
            lock_org_and_get_limits(&mut transaction, coordinator_id, category.pageant_id).await?;
        if let Some(round_id) = round_id {
            let round_exists = sqlx::query_scalar::<_, bool>(
                "SELECT EXISTS (SELECT 1 FROM pageant_rounds WHERE id = $1 AND pageant_id = $2)",
            )
            .bind(round_id)
            .bind(category.pageant_id)
            .fetch_one(&mut *transaction)
            .await
            .map_err(database_error)?;
            if !round_exists {
                return Err(AppError::BadRequest(
                    "select a round from this pageant".to_owned(),
                ));
            }
        }
        if let Some(round_id) = round_id {
            let current_count = sqlx::query_scalar::<_, i64>(
                "SELECT COUNT(*) FROM pageant_round_categories round_category \
                 INNER JOIN pageant_categories category ON category.id = round_category.category_id \
                 WHERE round_category.round_id = $1 AND category.is_active = TRUE",
            )
            .bind(round_id)
            .fetch_one(&mut *transaction)
            .await
            .map_err(database_error)?;
            ensure_below_limit(
                current_count,
                limits.max_categories_per_round,
                "categories per round",
            )?;
        }
        let query = format!(
            "INSERT INTO pageant_categories AS category \
             (id, pageant_id, code, name, description, display_order, eligibility_scope, eligibility_notes) \
             SELECT $1, $2, $3, $4, $5, $6, $7, $8 \
             WHERE EXISTS (SELECT 1 FROM pageant_member_roles assignment \
                 INNER JOIN roles assigned_role ON assigned_role.id = assignment.role_id \
                 WHERE assignment.pageant_id = $2 AND assignment.user_id = $9 \
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
            .bind(&category.eligibility_scope)
            .bind(&category.eligibility_notes)
            .bind(coordinator_id)
            .fetch_optional(&mut *transaction)
            .await
            .map_err(map_category_error)?
            .ok_or(AppError::Forbidden)?;
        let created = row.into();
        if let Some(round_id) = round_id {
            sqlx::query("INSERT INTO pageant_round_categories (pageant_id, round_id, category_id, weight_percentage) VALUES ($1, $2, $3, 0)")
                .bind(category.pageant_id)
                .bind(round_id)
                .bind(category.id)
                .execute(&mut *transaction)
                .await
                .map_err(database_error)?;
        }
        transaction.commit().await.map_err(database_error)?;
        Ok(created)
    }

    async fn update_category(
        &self,
        coordinator_id: Uuid,
        category: PageantCategory,
    ) -> Result<PageantCategory, AppError> {
        ensure_coordinator(&self.pool, coordinator_id, category.pageant_id).await?;
        let query = format!(
            "UPDATE pageant_categories category SET code = $3, name = $4, \
             description = $5, display_order = $6, eligibility_scope = $7, eligibility_notes = $8 \
             WHERE category.pageant_id = $1 AND category.id = $2 \
               AND EXISTS (SELECT 1 FROM pageant_member_roles assignment \
                   INNER JOIN roles assigned_role ON assigned_role.id = assignment.role_id \
                   WHERE assignment.pageant_id = $1 AND assignment.user_id = $9 \
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
            .bind(&category.eligibility_scope)
            .bind(&category.eligibility_notes)
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

    async fn activate_category(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
        category_id: Uuid,
    ) -> Result<(), AppError> {
        ensure_coordinator(&self.pool, coordinator_id, pageant_id).await?;
        let mut tx = self.pool.begin().await.map_err(database_error)?;
        let limits = lock_org_and_get_limits(&mut tx, coordinator_id, pageant_id).await?;
        let round_ids = sqlx::query_scalar::<_, Uuid>(
            "SELECT round_id FROM pageant_round_categories WHERE category_id = $1",
        )
        .bind(category_id)
        .fetch_all(&mut *tx)
        .await
        .map_err(database_error)?;
        for round_id in round_ids {
            let active_count = sqlx::query_scalar::<_, i64>(
                "SELECT COUNT(*) FROM pageant_round_categories round_category \
                 INNER JOIN pageant_categories category ON category.id = round_category.category_id \
                 WHERE round_category.round_id = $1 AND category.is_active = TRUE",
            )
            .bind(round_id)
            .fetch_one(&mut *tx)
            .await
            .map_err(database_error)?;
            ensure_below_limit(
                active_count,
                limits.max_categories_per_round,
                "categories per round",
            )?;
        }
        let changed = sqlx::query_scalar::<_, Uuid>("UPDATE pageant_categories SET is_active=TRUE WHERE id=$1 AND pageant_id=$2 AND is_active=FALSE RETURNING id")
            .bind(category_id).bind(pageant_id).fetch_optional(&mut *tx).await.map_err(map_category_error)?;
        if changed.is_none() {
            return Err(AppError::NotFound("inactive pageant category".to_owned()));
        }
        tx.commit().await.map_err(database_error)
    }

    async fn update_category_status(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
        category_id: Uuid,
        expected_status: String,
        status: String,
    ) -> Result<String, AppError> {
        ensure_coordinator(&self.pool, coordinator_id, pageant_id).await?;
        let updated = sqlx::query_scalar::<_, String>(
            "UPDATE pageant_categories category SET status = $4 \
             WHERE category.pageant_id = $1 AND category.id = $2 AND category.is_active = TRUE \
               AND category.status = $5 \
               AND EXISTS (SELECT 1 FROM pageant_member_roles assignment \
                   INNER JOIN roles assigned_role ON assigned_role.id = assignment.role_id \
                   WHERE assignment.pageant_id = $1 AND assignment.user_id = $3 \
                     AND assignment.is_active = TRUE AND assigned_role.code = 'PAGEANT_COORDINATOR' \
                     AND assigned_role.scope = 'PAGEANT'::role_scope AND assigned_role.is_active = TRUE) \
               AND ($4 <> 'OPEN' OR EXISTS ( \
                   SELECT 1 FROM pageant_round_categories link \
                   INNER JOIN pageant_rounds round ON round.id = link.round_id AND round.pageant_id = link.pageant_id \
                   WHERE link.category_id = category.id AND link.pageant_id = category.pageant_id \
                     AND round.status = 'OPEN'::round_status \
                     AND EXISTS (SELECT 1 FROM round_criteria rc INNER JOIN criteria criterion ON criterion.id = rc.criterion_id \
                         WHERE rc.round_id = round.id AND rc.category_id = category.id AND criterion.is_active = TRUE \
                         GROUP BY rc.round_id, rc.category_id HAVING COUNT(*) > 0 AND SUM(rc.weight_percentage) = 100) \
               )) \
             RETURNING category.status",
        )
        .bind(pageant_id)
        .bind(category_id)
        .bind(coordinator_id)
        .bind(&status)
        .bind(&expected_status)
        .fetch_optional(&self.pool)
        .await
        .map_err(database_error)?;
        updated.ok_or_else(|| {
            if status == "OPEN" {
                AppError::Conflict(
                    "Open the category's round and make sure its criteria total 100 points first."
                        .to_owned(),
                )
            } else {
                AppError::Conflict(
                    "The category status changed or the category is inactive.".to_owned(),
                )
            }
        })
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

    async fn activate_criterion(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
        criterion_id: Uuid,
    ) -> Result<(), AppError> {
        ensure_coordinator(&self.pool, coordinator_id, pageant_id).await?;
        let changed = sqlx::query_scalar::<_, Uuid>("UPDATE criteria SET is_active=TRUE WHERE id=$1 AND pageant_id=$2 AND is_active=FALSE RETURNING id")
            .bind(criterion_id).bind(pageant_id).fetch_optional(&self.pool).await.map_err(map_criterion_error)?;
        changed
            .map(|_| ())
            .ok_or_else(|| AppError::NotFound("inactive judging criterion".to_owned()))
    }

    async fn get_round_configuration(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
        round_id: Uuid,
    ) -> Result<crate::domain::pageant_setup::RoundJudgingConfiguration, AppError> {
        use crate::domain::pageant_setup::{
            RoundCategoryConfig, RoundCriterionConfig, RoundJudgingConfiguration,
        };
        ensure_coordinator(&self.pool, coordinator_id, pageant_id).await?;
        let round_exists = sqlx::query_scalar::<_, bool>(
            "SELECT EXISTS (SELECT 1 FROM pageant_rounds WHERE id = $1 AND pageant_id = $2)",
        )
        .bind(round_id)
        .bind(pageant_id)
        .fetch_one(&self.pool)
        .await
        .map_err(database_error)?;
        if !round_exists {
            return Err(AppError::NotFound("pageant round".to_owned()));
        }
        let categories = sqlx::query_as::<_, (Uuid, Decimal)>(
            "SELECT category_id, weight_percentage FROM pageant_round_categories WHERE round_id = $1 ORDER BY category_id",
        ).bind(round_id).fetch_all(&self.pool).await.map_err(database_error)?;
        let category_ids = categories.iter().map(|(id, _)| *id).collect();
        let rows = sqlx::query_as::<_, (Uuid, Uuid, Decimal, Decimal, Decimal, i32)>(
            "SELECT criterion_id, category_id, weight_percentage, maximum_score, minimum_score, display_order FROM round_criteria WHERE round_id = $1 ORDER BY category_id, display_order, criterion_id",
        ).bind(round_id).fetch_all(&self.pool).await.map_err(database_error)?;
        Ok(RoundJudgingConfiguration {
            category_ids,
            categories: categories
                .into_iter()
                .map(|(category_id, weight_percentage)| RoundCategoryConfig {
                    category_id,
                    weight_percentage,
                })
                .collect(),
            criteria: rows
                .into_iter()
                .map(
                    |(
                        criterion_id,
                        category_id,
                        weight_percentage,
                        maximum_score,
                        minimum_score,
                        display_order,
                    )| RoundCriterionConfig {
                        criterion_id,
                        category_id,
                        weight_percentage,
                        maximum_score,
                        minimum_score,
                        display_order,
                    },
                )
                .collect(),
        })
    }

    async fn save_round_configuration(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
        round_id: Uuid,
        configuration: crate::domain::pageant_setup::RoundJudgingConfiguration,
    ) -> Result<crate::domain::pageant_setup::RoundJudgingConfiguration, AppError> {
        ensure_coordinator(&self.pool, coordinator_id, pageant_id).await?;
        let mut transaction = self.pool.begin().await.map_err(database_error)?;
        let limits = lock_org_and_get_limits(&mut transaction, coordinator_id, pageant_id).await?;
        let round_exists = sqlx::query_scalar::<_, bool>(
            "SELECT EXISTS (SELECT 1 FROM pageant_rounds WHERE id = $1 AND pageant_id = $2 FOR UPDATE)",
        ).bind(round_id).bind(pageant_id).fetch_one(&mut *transaction).await.map_err(database_error)?;
        if !round_exists {
            return Err(AppError::NotFound("pageant round".to_owned()));
        }
        ensure_within_limit(
            configuration.category_ids.len() as i64,
            limits.max_categories_per_round,
            "categories per round",
        )?;
        let has_scores = sqlx::query_scalar::<_, bool>(
            "SELECT EXISTS (SELECT 1 FROM judge_scores score JOIN round_criteria rc ON rc.id = score.round_criterion_id WHERE rc.round_id = $1) OR EXISTS (SELECT 1 FROM judge_assignments ja JOIN score_sheets ss ON ss.judge_assignment_id = ja.id WHERE ja.round_id = $1)",
        ).bind(round_id).fetch_one(&mut *transaction).await.map_err(database_error)?;
        if has_scores {
            return Err(AppError::Conflict(
                "judging configuration cannot be changed after scores have been recorded"
                    .to_owned(),
            ));
        }

        for category_id in &configuration.category_ids {
            let valid = sqlx::query_scalar::<_, bool>(
                "SELECT EXISTS (SELECT 1 FROM pageant_categories WHERE id = $1 AND pageant_id = $2 AND is_active = TRUE)",
            ).bind(category_id).bind(pageant_id).fetch_one(&mut *transaction).await.map_err(database_error)?;
            if !valid {
                return Err(AppError::BadRequest(
                    "a selected category is inactive or belongs to another pageant".to_owned(),
                ));
            }
        }
        for item in &configuration.criteria {
            if !configuration.category_ids.contains(&item.category_id) {
                return Err(AppError::BadRequest(
                    "a criterion is assigned to a category that is not selected for this round; remove that assignment or add the category to the round".to_owned(),
                ));
            }
            let criterion_is_active = sqlx::query_scalar::<_, bool>(
                "SELECT EXISTS (SELECT 1 FROM criteria WHERE id = $1 AND pageant_id = $2 AND is_active = TRUE)",
            )
            .bind(item.criterion_id)
            .bind(pageant_id)
            .fetch_one(&mut *transaction)
            .await
            .map_err(database_error)?;
            if !criterion_is_active {
                return Err(AppError::BadRequest(
                    "a selected criterion is inactive or does not belong to this pageant; reactivate it or remove it from the category".to_owned(),
                ));
            }
            let category_is_active = sqlx::query_scalar::<_, bool>(
                "SELECT EXISTS (SELECT 1 FROM pageant_categories WHERE id = $1 AND pageant_id = $2 AND is_active = TRUE)",
            )
            .bind(item.category_id)
            .bind(pageant_id)
            .fetch_one(&mut *transaction)
            .await
            .map_err(database_error)?;
            if !category_is_active {
                return Err(AppError::BadRequest(
                    "a criterion is assigned to an inactive category; reactivate the category before saving its criteria".to_owned(),
                ));
            }
        }

        sqlx::query("DELETE FROM round_criteria WHERE round_id = $1")
            .bind(round_id)
            .execute(&mut *transaction)
            .await
            .map_err(database_error)?;
        sqlx::query("DELETE FROM pageant_round_categories WHERE round_id = $1")
            .bind(round_id)
            .execute(&mut *transaction)
            .await
            .map_err(database_error)?;
        for category_id in &configuration.category_ids {
            let weight = configuration
                .categories
                .iter()
                .find(|item| item.category_id == *category_id)
                .map(|item| item.weight_percentage)
                .ok_or_else(|| {
                    AppError::BadRequest("each selected category must have a weight".to_owned())
                })?;
            sqlx::query("INSERT INTO pageant_round_categories (pageant_id, round_id, category_id, weight_percentage) VALUES ($1, $2, $3, $4)")
                .bind(pageant_id).bind(round_id).bind(category_id).bind(weight).execute(&mut *transaction).await.map_err(database_error)?;
        }
        for item in &configuration.criteria {
            sqlx::query("INSERT INTO round_criteria (round_id, criterion_id, category_id, weight_percentage, maximum_score, minimum_score, display_order) VALUES ($1, $2, $3, $4, $5, $6, $7)")
                .bind(round_id).bind(item.criterion_id).bind(item.category_id).bind(item.weight_percentage)
                .bind(item.maximum_score).bind(item.minimum_score).bind(item.display_order)
                .execute(&mut *transaction).await.map_err(database_error)?;
        }
        transaction.commit().await.map_err(database_error)?;
        Ok(configuration)
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
