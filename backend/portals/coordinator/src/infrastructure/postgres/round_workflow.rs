use async_trait::async_trait;
use chrono::{DateTime, Utc};
use core_infra::AppError;
use sqlx::{FromRow, PgPool};
use uuid::Uuid;

use crate::{
    application::ports::round_workflow::RoundWorkflow,
    domain::round::{PageantRound, RoundStatus, RoundType},
};

pub struct PostgresRoundWorkflow {
    pool: PgPool,
}

impl PostgresRoundWorkflow {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[derive(FromRow)]
struct RoundRow {
    id: Uuid,
    pageant_id: Uuid,
    name: String,
    round_number: i32,
    round_type: String,
    status: String,
    advancement_count: Option<i32>,
    starts_at: Option<DateTime<Utc>>,
    ends_at: Option<DateTime<Utc>>,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
}

impl TryFrom<RoundRow> for PageantRound {
    type Error = AppError;

    fn try_from(row: RoundRow) -> Result<Self, Self::Error> {
        let round_type = match row.round_type.as_str() {
            "PRELIMINARY" => RoundType::Preliminary,
            "SWIMWEAR" => RoundType::Swimwear,
            "FORMAL_WEAR" => RoundType::FormalWear,
            "TALENT" => RoundType::Talent,
            "QUESTION_AND_ANSWER" => RoundType::QuestionAndAnswer,
            "FINAL" => RoundType::Final,
            "CUSTOM" => RoundType::Custom,
            _ => return Err(AppError::Configuration("unknown round type".to_owned())),
        };
        let status = match row.status.as_str() {
            "DRAFT" => RoundStatus::Draft,
            "OPEN" => RoundStatus::Open,
            "CLOSED" => RoundStatus::Closed,
            "FINALIZED" => RoundStatus::Finalized,
            _ => return Err(AppError::Configuration("unknown round status".to_owned())),
        };
        Ok(Self {
            id: row.id,
            pageant_id: row.pageant_id,
            name: row.name,
            round_number: row.round_number,
            round_type,
            status,
            advancement_count: row.advancement_count,
            starts_at: row.starts_at,
            ends_at: row.ends_at,
            created_at: row.created_at,
            updated_at: row.updated_at,
        })
    }
}

const ROUND_COLUMNS: &str = "round.id, round.pageant_id, round.name, round.round_number, \
    round.round_type::text AS round_type, round.status::text AS status, \
    round.advancement_count, round.starts_at, round.ends_at, round.created_at, round.updated_at";

#[async_trait]
impl RoundWorkflow for PostgresRoundWorkflow {
    async fn list(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
    ) -> Result<Vec<PageantRound>, AppError> {
        ensure_coordinator(&self.pool, coordinator_id, pageant_id).await?;
        let query = format!(
            "SELECT {ROUND_COLUMNS} FROM pageant_rounds round \
             WHERE round.pageant_id = $1 \
               AND EXISTS (SELECT 1 FROM pageant_member_roles assignment \
                   INNER JOIN roles assigned_role ON assigned_role.id = assignment.role_id \
                   WHERE assignment.pageant_id = $1 AND assignment.user_id = $2 \
                     AND assignment.is_active = TRUE AND assigned_role.code = 'PAGEANT_COORDINATOR' \
                     AND assigned_role.scope = 'PAGEANT'::role_scope AND assigned_role.is_active = TRUE) \
             ORDER BY round.round_number, round.name, round.id"
        );
        let rows = sqlx::query_as::<_, RoundRow>(&query)
            .bind(pageant_id)
            .bind(coordinator_id)
            .fetch_all(&self.pool)
            .await
            .map_err(database_error)?;
        rows.into_iter().map(TryInto::try_into).collect()
    }

    async fn get(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
        round_id: Uuid,
    ) -> Result<PageantRound, AppError> {
        ensure_coordinator(&self.pool, coordinator_id, pageant_id).await?;
        let query = format!(
            "SELECT {ROUND_COLUMNS} FROM pageant_rounds round \
             WHERE round.pageant_id = $1 AND round.id = $2 \
               AND EXISTS (SELECT 1 FROM pageant_member_roles assignment \
                   INNER JOIN roles assigned_role ON assigned_role.id = assignment.role_id \
                   WHERE assignment.pageant_id = $1 AND assignment.user_id = $3 \
                     AND assignment.is_active = TRUE AND assigned_role.code = 'PAGEANT_COORDINATOR' \
                     AND assigned_role.scope = 'PAGEANT'::role_scope AND assigned_role.is_active = TRUE)"
        );
        sqlx::query_as::<_, RoundRow>(&query)
            .bind(pageant_id)
            .bind(round_id)
            .bind(coordinator_id)
            .fetch_optional(&self.pool)
            .await
            .map_err(database_error)?
            .map(TryInto::try_into)
            .transpose()?
            .ok_or_else(|| AppError::NotFound("pageant round".to_owned()))
    }

    async fn create(
        &self,
        coordinator_id: Uuid,
        round: PageantRound,
    ) -> Result<PageantRound, AppError> {
        ensure_coordinator(&self.pool, coordinator_id, round.pageant_id).await?;
        let query = format!(
            "INSERT INTO pageant_rounds AS round \
             (id, pageant_id, name, round_number, round_type, status, advancement_count, starts_at, ends_at) \
             SELECT $1, $2, $3, $4, $5::round_type, 'DRAFT'::round_status, $6, $7, $8 \
             WHERE EXISTS (SELECT 1 FROM pageant_member_roles assignment \
                 INNER JOIN roles assigned_role ON assigned_role.id = assignment.role_id \
                 WHERE assignment.pageant_id = $2 AND assignment.user_id = $9 \
                   AND assignment.is_active = TRUE AND assigned_role.code = 'PAGEANT_COORDINATOR' \
                   AND assigned_role.scope = 'PAGEANT'::role_scope AND assigned_role.is_active = TRUE) \
             RETURNING {ROUND_COLUMNS}"
        );
        let row = sqlx::query_as::<_, RoundRow>(&query)
            .bind(round.id)
            .bind(round.pageant_id)
            .bind(&round.name)
            .bind(round.round_number)
            .bind(round.round_type.as_db_str())
            .bind(round.advancement_count)
            .bind(round.starts_at)
            .bind(round.ends_at)
            .bind(coordinator_id)
            .fetch_optional(&self.pool)
            .await
            .map_err(map_round_error)?
            .ok_or(AppError::Forbidden)?;
        row.try_into()
    }

    async fn update(
        &self,
        coordinator_id: Uuid,
        round: PageantRound,
        expected_status: RoundStatus,
    ) -> Result<PageantRound, AppError> {
        ensure_coordinator(&self.pool, coordinator_id, round.pageant_id).await?;
        let query = format!(
            "UPDATE pageant_rounds round SET name = $3, round_number = $4, \
             round_type = $5::round_type, status = $6::round_status, advancement_count = $7, \
             starts_at = $8, ends_at = $9 \
             WHERE round.pageant_id = $1 AND round.id = $2 \
               AND round.status = $10::round_status \
               AND EXISTS (SELECT 1 FROM pageant_member_roles assignment \
                   INNER JOIN roles assigned_role ON assigned_role.id = assignment.role_id \
                   WHERE assignment.pageant_id = $1 AND assignment.user_id = $11 \
                     AND assignment.is_active = TRUE AND assigned_role.code = 'PAGEANT_COORDINATOR' \
                     AND assigned_role.scope = 'PAGEANT'::role_scope AND assigned_role.is_active = TRUE) \
             RETURNING {ROUND_COLUMNS}"
        );
        let row = sqlx::query_as::<_, RoundRow>(&query)
            .bind(round.pageant_id)
            .bind(round.id)
            .bind(&round.name)
            .bind(round.round_number)
            .bind(round.round_type.as_db_str())
            .bind(round.status.as_db_str())
            .bind(round.advancement_count)
            .bind(round.starts_at)
            .bind(round.ends_at)
            .bind(expected_status.as_db_str())
            .bind(coordinator_id)
            .fetch_optional(&self.pool)
            .await
            .map_err(map_round_error)?
            .ok_or_else(|| {
                AppError::Conflict("round changed or is no longer assigned".to_owned())
            })?;
        row.try_into()
    }

    async fn delete(
        &self,
        coordinator_id: Uuid,
        pageant_id: Uuid,
        round_id: Uuid,
    ) -> Result<(), AppError> {
        ensure_coordinator(&self.pool, coordinator_id, pageant_id).await?;
        let deleted = sqlx::query_scalar::<_, Uuid>(
            r#"
            DELETE FROM pageant_rounds round
            WHERE round.pageant_id = $1 AND round.id = $2
              AND round.status = 'DRAFT'::round_status
              AND NOT EXISTS (SELECT 1 FROM candidate_rounds candidate_round WHERE candidate_round.round_id = round.id)
              AND NOT EXISTS (SELECT 1 FROM judge_assignments assignment WHERE assignment.round_id = round.id)
              AND NOT EXISTS (SELECT 1 FROM advancement_decisions decision
                  WHERE decision.from_round_id = round.id OR decision.to_round_id = round.id)
              AND NOT EXISTS (SELECT 1 FROM tabulation_runs run WHERE run.round_id = round.id)
              AND NOT EXISTS (SELECT 1 FROM voting_configurations config WHERE config.round_id = round.id)
              AND EXISTS (SELECT 1 FROM pageant_member_roles assignment
                  INNER JOIN roles assigned_role ON assigned_role.id = assignment.role_id
                  WHERE assignment.pageant_id = round.pageant_id AND assignment.user_id = $3
                    AND assignment.is_active = TRUE AND assigned_role.code = 'PAGEANT_COORDINATOR'
                    AND assigned_role.scope = 'PAGEANT'::role_scope AND assigned_role.is_active = TRUE)
            RETURNING round.id
            "#,
        )
        .bind(pageant_id)
        .bind(round_id)
        .bind(coordinator_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(database_error)?;
        if deleted.is_some() {
            return Ok(());
        }

        let current_status = sqlx::query_scalar::<_, Option<String>>(
            "SELECT status::text FROM pageant_rounds WHERE pageant_id = $1 AND id = $2",
        )
        .bind(pageant_id)
        .bind(round_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(database_error)?;
        match current_status.flatten().as_deref() {
            None => Err(AppError::NotFound("pageant round".to_owned())),
            Some("DRAFT") => Err(AppError::Conflict(
                "rounds with contestant, judge, advancement, tabulation, or voting records cannot be deleted".to_owned(),
            )),
            Some(_) => Err(AppError::Conflict(
                "only draft rounds can be deleted".to_owned(),
            )),
        }
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

fn map_round_error(error: sqlx::Error) -> AppError {
    if let sqlx::Error::Database(database_error) = &error {
        if database_error.code().as_deref() == Some("23505") {
            let constraint = database_error.constraint().unwrap_or_default();
            if constraint == "pageant_rounds_pageant_id_round_number_key" {
                return AppError::Conflict(
                    "round number already exists for this pageant".to_owned(),
                );
            }
            if constraint == "pageant_rounds_pageant_id_name_key" {
                return AppError::Conflict("round name already exists for this pageant".to_owned());
            }
        }
    }
    database_error(error)
}

fn database_error(error: sqlx::Error) -> AppError {
    AppError::Database(Box::new(error))
}
