use async_trait::async_trait;
use chrono::{DateTime, Utc};
use core_infra::AppError;
use sqlx::{FromRow, PgPool};
use uuid::Uuid;

use crate::{
    application::ports::contestant_workflow::ContestantWorkflow,
    domain::contestant::{Contestant, ContestantPlacements},
};

pub struct PostgresContestantWorkflow {
    pool: PgPool,
}

impl PostgresContestantWorkflow {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[derive(FromRow)]
struct ContestantRow {
    id: Uuid,
    pageant_id: Uuid,
    user_id: Option<Uuid>,
    contestant_number: i32,
    first_name: String,
    middle_name: Option<String>,
    last_name: String,
    display_name: String,
    gender: Option<String>,
    photo_url: Option<String>,
    biography: Option<String>,
    is_active: bool,
    current_round_status: Option<String>,
    current_round_name: Option<String>,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
}

impl From<ContestantRow> for Contestant {
    fn from(row: ContestantRow) -> Self {
        Self {
            id: row.id,
            pageant_id: row.pageant_id,
            user_id: row.user_id,
            contestant_number: row.contestant_number,
            first_name: row.first_name,
            middle_name: row.middle_name,
            last_name: row.last_name,
            display_name: row.display_name,
            gender: row.gender,
            photo_url: row.photo_url,
            biography: row.biography,
            is_active: row.is_active,
            current_round_status: row.current_round_status,
            current_round_name: row.current_round_name,
            created_at: row.created_at,
            updated_at: row.updated_at,
        }
    }
}

const CONTESTANT_COLUMNS: &str = "contestant.id, contestant.pageant_id, contestant.user_id, \
    contestant.contestant_number, contestant.first_name, contestant.middle_name, \
    contestant.last_name, contestant.display_name, contestant.gender, contestant.photo_url, \
    contestant.biography, contestant.is_active, \
    (SELECT candidate_round.status::TEXT FROM candidate_rounds candidate_round \
     INNER JOIN pageant_rounds round ON round.id = candidate_round.round_id \
     WHERE candidate_round.contestant_id = contestant.id \
     ORDER BY round.round_number DESC LIMIT 1) AS current_round_status, \
    (SELECT round.name FROM candidate_rounds candidate_round \
     INNER JOIN pageant_rounds round ON round.id = candidate_round.round_id \
     WHERE candidate_round.contestant_id = contestant.id \
     ORDER BY round.round_number DESC LIMIT 1) AS current_round_name, \
    contestant.created_at, contestant.updated_at";

#[async_trait]
impl ContestantWorkflow for PostgresContestantWorkflow {
    async fn list(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
    ) -> Result<Vec<Contestant>, AppError> {
        ensure_coordinator_assignment(&self.pool, coordinator_id, pageant_id).await?;
        let query = format!(
            "SELECT {CONTESTANT_COLUMNS} FROM contestants contestant \
             WHERE contestant.pageant_id = $1 \
               AND EXISTS (SELECT 1 FROM pageant_member_roles assignment \
                   INNER JOIN roles assigned_role ON assigned_role.id = assignment.role_id \
                   WHERE assignment.pageant_id = $1 AND assignment.user_id = $2 \
                     AND assignment.is_active = TRUE \
                     AND assigned_role.code = 'PAGEANT_COORDINATOR' \
                     AND assigned_role.scope = 'PAGEANT'::role_scope \
                     AND assigned_role.is_active = TRUE) \
             ORDER BY contestant.contestant_number, contestant.last_name, contestant.first_name"
        );
        let rows = sqlx::query_as::<_, ContestantRow>(&query)
            .bind(pageant_id)
            .bind(coordinator_id)
            .fetch_all(&self.pool)
            .await
            .map_err(database_error)?;
        Ok(rows.into_iter().map(Contestant::from).collect())
    }

    async fn get(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
        contestant_id: Uuid,
    ) -> Result<Contestant, AppError> {
        ensure_coordinator_assignment(&self.pool, coordinator_id, pageant_id).await?;
        let query = format!(
            "SELECT {CONTESTANT_COLUMNS} FROM contestants contestant \
             WHERE contestant.pageant_id = $1 AND contestant.id = $2 \
               AND EXISTS (SELECT 1 FROM pageant_member_roles assignment \
                   INNER JOIN roles assigned_role ON assigned_role.id = assignment.role_id \
                   WHERE assignment.pageant_id = $1 AND assignment.user_id = $3 \
                     AND assignment.is_active = TRUE \
                     AND assigned_role.code = 'PAGEANT_COORDINATOR' \
                     AND assigned_role.scope = 'PAGEANT'::role_scope \
                     AND assigned_role.is_active = TRUE)"
        );
        sqlx::query_as::<_, ContestantRow>(&query)
            .bind(pageant_id)
            .bind(contestant_id)
            .bind(coordinator_id)
            .fetch_optional(&self.pool)
            .await
            .map_err(database_error)?
            .map(Contestant::from)
            .ok_or_else(|| AppError::NotFound("contestant".to_owned()))
    }

    async fn create(
        &self,
        coordinator_id: Uuid,
        contestant: Contestant,
    ) -> Result<Contestant, AppError> {
        ensure_coordinator_assignment(&self.pool, coordinator_id, contestant.pageant_id).await?;
        validate_linked_user(&self.pool, contestant.user_id).await?;
        let query = format!(
            "INSERT INTO contestants AS contestant ( \
                id, pageant_id, user_id, contestant_number, first_name, middle_name, last_name, \
                display_name, gender, photo_url, biography \
             ) SELECT $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11 \
             WHERE EXISTS (SELECT 1 FROM pageant_member_roles assignment \
                 INNER JOIN roles assigned_role ON assigned_role.id = assignment.role_id \
                 WHERE assignment.pageant_id = $2 AND assignment.user_id = $12 \
                   AND assignment.is_active = TRUE \
                   AND assigned_role.code = 'PAGEANT_COORDINATOR' \
                   AND assigned_role.scope = 'PAGEANT'::role_scope \
                   AND assigned_role.is_active = TRUE) \
             RETURNING {CONTESTANT_COLUMNS}"
        );
        let row = sqlx::query_as::<_, ContestantRow>(&query)
            .bind(contestant.id)
            .bind(contestant.pageant_id)
            .bind(contestant.user_id)
            .bind(contestant.contestant_number)
            .bind(&contestant.first_name)
            .bind(&contestant.middle_name)
            .bind(&contestant.last_name)
            .bind(&contestant.display_name)
            .bind(&contestant.gender)
            .bind(&contestant.photo_url)
            .bind(&contestant.biography)
            .bind(coordinator_id)
            .fetch_optional(&self.pool)
            .await
            .map_err(map_contestant_write_error)?
            .ok_or(AppError::Forbidden)?;
        Ok(row.into())
    }

    async fn update(
        &self,
        coordinator_id: Uuid,
        contestant: Contestant,
    ) -> Result<Contestant, AppError> {
        ensure_coordinator_assignment(&self.pool, coordinator_id, contestant.pageant_id).await?;
        validate_linked_user(&self.pool, contestant.user_id).await?;
        let query = format!(
            "UPDATE contestants contestant SET user_id = $3, contestant_number = $4, \
             first_name = $5, middle_name = $6, last_name = $7, display_name = $8, \
             gender = $9, photo_url = $10, biography = $11 \
             WHERE contestant.pageant_id = $1 AND contestant.id = $2 \
               AND EXISTS (SELECT 1 FROM pageant_member_roles assignment \
                   INNER JOIN roles assigned_role ON assigned_role.id = assignment.role_id \
                   WHERE assignment.pageant_id = $1 AND assignment.user_id = $12 \
                     AND assignment.is_active = TRUE \
                     AND assigned_role.code = 'PAGEANT_COORDINATOR' \
                     AND assigned_role.scope = 'PAGEANT'::role_scope \
                     AND assigned_role.is_active = TRUE) \
             RETURNING {CONTESTANT_COLUMNS}"
        );
        let row = sqlx::query_as::<_, ContestantRow>(&query)
            .bind(contestant.pageant_id)
            .bind(contestant.id)
            .bind(contestant.user_id)
            .bind(contestant.contestant_number)
            .bind(&contestant.first_name)
            .bind(&contestant.middle_name)
            .bind(&contestant.last_name)
            .bind(&contestant.display_name)
            .bind(&contestant.gender)
            .bind(&contestant.photo_url)
            .bind(&contestant.biography)
            .bind(coordinator_id)
            .fetch_optional(&self.pool)
            .await
            .map_err(map_contestant_write_error)?
            .ok_or_else(|| AppError::NotFound("assigned contestant".to_owned()))?;
        Ok(row.into())
    }

    async fn deactivate(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
        contestant_id: Uuid,
    ) -> Result<(), AppError> {
        ensure_coordinator_assignment(&self.pool, coordinator_id, pageant_id).await?;
        let changed = sqlx::query_scalar::<_, Uuid>(
            "UPDATE contestants SET is_active = FALSE \
             WHERE pageant_id = $1 AND id = $2 AND is_active = TRUE \
               AND EXISTS (SELECT 1 FROM pageant_member_roles assignment \
                   INNER JOIN roles assigned_role ON assigned_role.id = assignment.role_id \
                   WHERE assignment.pageant_id = $1 AND assignment.user_id = $3 \
                     AND assignment.is_active = TRUE \
                     AND assigned_role.code = 'PAGEANT_COORDINATOR' \
                     AND assigned_role.scope = 'PAGEANT'::role_scope \
                     AND assigned_role.is_active = TRUE) \
             RETURNING id",
        )
        .bind(pageant_id)
        .bind(contestant_id)
        .bind(coordinator_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(database_error)?;
        changed
            .map(|_| ())
            .ok_or_else(|| AppError::NotFound("active contestant".to_owned()))
    }

    async fn get_placements(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
        contestant_id: Uuid,
    ) -> Result<ContestantPlacements, AppError> {
        ensure_coordinator_assignment(&self.pool, coordinator_id, pageant_id).await?;
        let exists = sqlx::query_scalar::<_, bool>(
            "SELECT EXISTS (SELECT 1 FROM contestants WHERE id=$1 AND pageant_id=$2)",
        )
        .bind(contestant_id)
        .bind(pageant_id)
        .fetch_one(&self.pool)
        .await
        .map_err(database_error)?;
        if !exists {
            return Err(AppError::NotFound("contestant".to_owned()));
        }
        let category_ids = sqlx::query_scalar::<_, Uuid>("SELECT category_id FROM contestant_categories WHERE contestant_id=$1 ORDER BY category_id")
            .bind(contestant_id).fetch_all(&self.pool).await.map_err(database_error)?;
        let round_ids = sqlx::query_scalar::<_, Uuid>(
            "SELECT round_id FROM candidate_rounds WHERE contestant_id=$1 ORDER BY round_id",
        )
        .bind(contestant_id)
        .fetch_all(&self.pool)
        .await
        .map_err(database_error)?;
        Ok(ContestantPlacements {
            category_ids,
            round_ids,
        })
    }

    async fn save_placements(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
        contestant_id: Uuid,
        placements: ContestantPlacements,
    ) -> Result<ContestantPlacements, AppError> {
        ensure_coordinator_assignment(&self.pool, coordinator_id, pageant_id).await?;
        let mut tx = self.pool.begin().await.map_err(database_error)?;
        let exists = sqlx::query_scalar::<_, bool>("SELECT EXISTS (SELECT 1 FROM contestants WHERE id=$1 AND pageant_id=$2 AND is_active=TRUE)")
            .bind(contestant_id).bind(pageant_id).fetch_one(&mut *tx).await.map_err(database_error)?;
        if !exists {
            return Err(AppError::NotFound("active contestant".to_owned()));
        }
        for id in &placements.category_ids {
            let valid = sqlx::query_scalar::<_, bool>("SELECT EXISTS (SELECT 1 FROM pageant_categories WHERE id=$1 AND pageant_id=$2 AND is_active=TRUE)")
                .bind(id).bind(pageant_id).fetch_one(&mut *tx).await.map_err(database_error)?;
            if !valid {
                return Err(AppError::BadRequest(
                    "a selected category is inactive or belongs to another pageant".to_owned(),
                ));
            }
        }
        for id in &placements.round_ids {
            let valid = sqlx::query_scalar::<_, bool>(
                "SELECT EXISTS (SELECT 1 FROM pageant_rounds WHERE id=$1 AND pageant_id=$2)",
            )
            .bind(id)
            .bind(pageant_id)
            .fetch_one(&mut *tx)
            .await
            .map_err(database_error)?;
            if !valid {
                return Err(AppError::BadRequest(
                    "a selected round belongs to another pageant or does not exist".to_owned(),
                ));
            }
            let category_match = sqlx::query_scalar::<_, bool>(
                "SELECT NOT EXISTS (SELECT 1 FROM pageant_round_categories WHERE round_id=$1) OR EXISTS (SELECT 1 FROM pageant_round_categories WHERE round_id=$1 AND category_id = ANY($2))",
            ).bind(id).bind(&placements.category_ids).fetch_one(&mut *tx).await.map_err(database_error)?;
            if !category_match {
                return Err(AppError::BadRequest("assign the candidate to at least one category configured for each selected round".to_owned()));
            }
        }

        let has_locked_round = sqlx::query_scalar::<_, bool>(
            "SELECT EXISTS (SELECT 1 FROM candidate_rounds cr WHERE cr.contestant_id=$1 AND NOT (cr.round_id = ANY($2)) AND (cr.status <> 'REGISTERED'::candidate_round_status OR EXISTS (SELECT 1 FROM score_sheets ss JOIN judge_assignments ja ON ja.id = ss.judge_assignment_id WHERE ss.contestant_id=$1 AND ja.round_id=cr.round_id) OR EXISTS (SELECT 1 FROM advancement_decisions ad WHERE ad.contestant_id=$1 AND (ad.from_round_id=cr.round_id OR ad.to_round_id=cr.round_id))))",
        ).bind(contestant_id).bind(&placements.round_ids).fetch_one(&mut *tx).await.map_err(database_error)?;
        if has_locked_round {
            return Err(AppError::Conflict("a candidate cannot be removed from a round after advancement or scoring has started".to_owned()));
        }

        sqlx::query("DELETE FROM contestant_categories WHERE contestant_id=$1 AND NOT (category_id = ANY($2))")
            .bind(contestant_id).bind(&placements.category_ids).execute(&mut *tx).await.map_err(database_error)?;
        sqlx::query(
            "DELETE FROM candidate_rounds WHERE contestant_id=$1 AND NOT (round_id = ANY($2))",
        )
        .bind(contestant_id)
        .bind(&placements.round_ids)
        .execute(&mut *tx)
        .await
        .map_err(database_error)?;
        for id in &placements.category_ids {
            sqlx::query("INSERT INTO contestant_categories (contestant_id, category_id) VALUES ($1,$2) ON CONFLICT (contestant_id,category_id) DO NOTHING")
                .bind(contestant_id).bind(id).execute(&mut *tx).await.map_err(database_error)?;
        }
        for id in &placements.round_ids {
            sqlx::query("INSERT INTO candidate_rounds (contestant_id, round_id) VALUES ($1,$2) ON CONFLICT (contestant_id,round_id) DO NOTHING")
                .bind(contestant_id).bind(id).execute(&mut *tx).await.map_err(database_error)?;
        }
        tx.commit().await.map_err(database_error)?;
        Ok(placements)
    }
}

async fn ensure_coordinator_assignment(
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

async fn validate_linked_user(pool: &PgPool, user_id: Option<Uuid>) -> Result<(), AppError> {
    if let Some(user_id) = user_id {
        let active = sqlx::query_scalar::<_, bool>(
            "SELECT EXISTS (SELECT 1 FROM users WHERE id = $1 AND status = 'ACTIVE'::user_account_status)",
        )
        .bind(user_id)
        .fetch_one(pool)
        .await
        .map_err(database_error)?;
        if !active {
            return Err(AppError::NotFound("active user for contestant".to_owned()));
        }
    }
    Ok(())
}

fn map_contestant_write_error(error: sqlx::Error) -> AppError {
    if let sqlx::Error::Database(database_error) = &error {
        if database_error.code().as_deref() == Some("23505") {
            if database_error
                .constraint()
                .is_some_and(|name| name == "uq_contestants_pageant_number_gender")
            {
                return AppError::Conflict(
                    "this contestant number is already used by another candidate of the same gender".to_owned(),
                );
            }
            if database_error
                .constraint()
                .is_some_and(|name| name == "uq_contestant_pageant_user")
            {
                return AppError::Conflict(
                    "this user is already linked to a contestant in the pageant".to_owned(),
                );
            }
        }
    }
    database_error(error)
}

fn database_error(error: sqlx::Error) -> AppError {
    AppError::Database(Box::new(error))
}
