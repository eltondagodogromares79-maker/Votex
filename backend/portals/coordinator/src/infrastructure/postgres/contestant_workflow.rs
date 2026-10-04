use async_trait::async_trait;
use chrono::{DateTime, Utc};
use core_infra::AppError;
use sqlx::{FromRow, PgPool};
use uuid::Uuid;

use crate::{
    application::ports::contestant_workflow::ContestantWorkflow, domain::contestant::Contestant,
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
            created_at: row.created_at,
            updated_at: row.updated_at,
        }
    }
}

const CONTESTANT_COLUMNS: &str = "contestant.id, contestant.pageant_id, contestant.user_id, \
    contestant.contestant_number, contestant.first_name, contestant.middle_name, \
    contestant.last_name, contestant.display_name, contestant.gender, contestant.photo_url, \
    contestant.biography, contestant.is_active, contestant.created_at, contestant.updated_at";

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
                .is_some_and(|name| name == "contestants_pageant_id_contestant_number_key")
            {
                return AppError::Conflict(
                    "this contestant number is already used in the pageant".to_owned(),
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
