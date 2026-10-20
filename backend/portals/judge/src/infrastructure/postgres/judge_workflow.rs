use crate::{
    application::ports::judge_workflow::JudgeWorkflow,
    domain::{
        contestant::Contestant,
        pageant::AssignedPageant,
        round::Round,
        setup::{
            Category, CategoryScoringWorkspace, CategorySubmissionResult, Criterion,
            CriterionScoreInput, SavedCriterionScore, ScoreSubmissionResult, ScoringCandidate,
            ScoringCriterion,
        },
    },
};
use async_trait::async_trait;
use chrono::{DateTime, NaiveDate, NaiveTime, Utc};
use core_infra::AppError;
use rust_decimal::Decimal;
use sqlx::{FromRow, PgPool};
use std::collections::{HashMap, HashSet};
use uuid::Uuid;

pub struct PostgresJudgeWorkflow {
    pool: PgPool,
}
impl PostgresJudgeWorkflow {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}
fn db(e: sqlx::Error) -> AppError {
    AppError::Database(Box::new(e))
}
async fn verify(pool: &PgPool, judge: Uuid, pageant: Uuid) -> Result<(), AppError> {
    let status = sqlx::query_scalar::<_, String>(
        "SELECT p.status::text FROM pageants p \
         JOIN pageant_member_roles a ON a.pageant_id = p.id \
         JOIN roles r ON r.id = a.role_id \
         WHERE a.user_id = $1 AND a.pageant_id = $2 AND a.is_active = TRUE \
           AND r.code = 'PAGEANT_JUDGE' AND r.scope = 'PAGEANT'::role_scope AND r.is_active = TRUE",
    )
    .bind(judge)
    .bind(pageant)
    .fetch_optional(pool)
    .await
    .map_err(db)?
    .ok_or_else(|| AppError::NotFound("assigned pageant".into()))?;

    match status.as_str() {
        // Completed pageants remain available for judges to review their work.
        "PUBLISHED" | "ONGOING" | "COMPLETED" => Ok(()),
        _ => Err(AppError::Forbidden),
    }
}
#[derive(FromRow)]
struct PageantRow {
    id: Uuid,
    organization_id: Uuid,
    organization_name: String,
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
#[derive(FromRow)]
struct ContestantRow {
    id: Uuid,
    pageant_id: Uuid,
    contestant_number: i32,
    first_name: String,
    middle_name: Option<String>,
    last_name: String,
    display_name: String,
    gender: Option<String>,
    photo_url: Option<String>,
    biography: Option<String>,
    is_active: bool,
}
#[derive(FromRow)]
struct CategoryRow {
    id: Uuid,
    pageant_id: Uuid,
    round_id: Option<Uuid>,
    code: String,
    name: String,
    description: Option<String>,
    display_order: i32,
    eligibility_scope: String,
    is_active: bool,
    status: String,
}
#[derive(FromRow)]
struct CriterionRow {
    id: Uuid,
    pageant_id: Uuid,
    code: String,
    name: String,
    description: Option<String>,
    default_maximum_score: rust_decimal::Decimal,
    default_minimum_score: rust_decimal::Decimal,
    is_active: bool,
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
}

#[derive(FromRow)]
struct ScoringCategoryRow {
    round_name: String,
    category_name: String,
    eligibility_scope: String,
}
#[derive(FromRow)]
struct ScoringCriterionRow {
    round_criterion_id: Uuid,
    criterion_id: Uuid,
    name: String,
    description: Option<String>,
    minimum_score: Decimal,
    maximum_score: Decimal,
    weight_percentage: Decimal,
    display_order: i32,
}
#[derive(FromRow)]
struct ScoringCandidateRow {
    id: Uuid,
    contestant_number: i32,
    display_name: String,
    gender: Option<String>,
    photo_url: Option<String>,
    biography: Option<String>,
}
#[derive(FromRow)]
struct SavedScoreRow {
    contestant_id: Uuid,
    submission_status: String,
    round_criterion_id: Uuid,
    raw_score: Decimal,
}
#[derive(FromRow)]
struct CriterionBound {
    id: Uuid,
    minimum_score: Decimal,
    maximum_score: Decimal,
    weight_percentage: Decimal,
}
#[async_trait]
impl JudgeWorkflow for PostgresJudgeWorkflow {
    async fn pageants(&self, judge: Uuid) -> Result<Vec<AssignedPageant>, AppError> {
        let rows = sqlx::query_as::<_, PageantRow>("SELECT p.id,p.organization_id,o.name AS organization_name,p.name,p.slug::text AS slug,p.description,p.logo_url,p.event_date,p.start_time,p.end_time,p.venue,p.status::text AS status,p.is_public FROM pageants p JOIN organizations o ON o.id=p.organization_id JOIN pageant_member_roles a ON a.pageant_id=p.id JOIN roles r ON r.id=a.role_id WHERE a.user_id=$1 AND a.is_active=TRUE AND r.code='PAGEANT_JUDGE' AND r.scope='PAGEANT'::role_scope AND r.is_active=TRUE ORDER BY p.event_date DESC NULLS LAST,p.created_at DESC,p.id")
   .bind(judge).fetch_all(&self.pool).await.map_err(db)?;
        Ok(rows
            .into_iter()
            .map(|r| AssignedPageant {
                id: r.id,
                organization_id: r.organization_id,
                organization_name: r.organization_name,
                name: r.name,
                slug: r.slug,
                description: r.description,
                logo_url: r.logo_url,
                event_date: r.event_date,
                start_time: r.start_time,
                end_time: r.end_time,
                venue: r.venue,
                status: r.status,
                is_public: r.is_public,
            })
            .collect())
    }
    async fn contestants(&self, judge: Uuid, pageant: Uuid) -> Result<Vec<Contestant>, AppError> {
        verify(&self.pool, judge, pageant).await?;
        let rows=sqlx::query_as::<_,ContestantRow>("SELECT id,pageant_id,contestant_number,first_name,middle_name,last_name,display_name,gender,photo_url,biography,is_active FROM contestants WHERE pageant_id=$1 AND is_active=TRUE ORDER BY contestant_number,last_name,first_name").bind(pageant).fetch_all(&self.pool).await.map_err(db)?;
        Ok(rows
            .into_iter()
            .map(|r| Contestant {
                id: r.id,
                pageant_id: r.pageant_id,
                contestant_number: r.contestant_number,
                first_name: r.first_name,
                middle_name: r.middle_name,
                last_name: r.last_name,
                display_name: r.display_name,
                gender: r.gender,
                photo_url: r.photo_url,
                biography: r.biography,
                is_active: r.is_active,
            })
            .collect())
    }
    async fn rounds(&self, judge: Uuid, pageant: Uuid) -> Result<Vec<Round>, AppError> {
        verify(&self.pool, judge, pageant).await?;
        let rows=sqlx::query_as::<_,RoundRow>("SELECT id,pageant_id,name,round_number,round_type::text AS round_type,status::text AS status,advancement_count,starts_at,ends_at FROM pageant_rounds WHERE pageant_id=$1 ORDER BY round_number,id").bind(pageant).fetch_all(&self.pool).await.map_err(db)?;
        Ok(rows
            .into_iter()
            .map(|r| Round {
                id: r.id,
                pageant_id: r.pageant_id,
                name: r.name,
                round_number: r.round_number,
                round_type: r.round_type,
                status: r.status,
                advancement_count: r.advancement_count,
                starts_at: r.starts_at,
                ends_at: r.ends_at,
            })
            .collect())
    }
    async fn categories(&self, judge: Uuid, pageant: Uuid) -> Result<Vec<Category>, AppError> {
        verify(&self.pool, judge, pageant).await?;
        let rows=sqlx::query_as::<_,CategoryRow>("SELECT category.id,category.pageant_id,round_category.round_id,category.code,category.name,category.description,category.display_order,category.eligibility_scope::text AS eligibility_scope,category.is_active,category.status FROM pageant_categories category JOIN pageant_round_categories round_category ON round_category.category_id=category.id JOIN pageant_rounds round ON round.id=round_category.round_id WHERE category.pageant_id=$1 AND category.is_active=TRUE AND round.status='OPEN'::round_status ORDER BY round.round_number,category.display_order,category.name").bind(pageant).fetch_all(&self.pool).await.map_err(db)?;
        Ok(rows
            .into_iter()
            .map(|r| Category {
                id: r.id,
                pageant_id: r.pageant_id,
                round_id: r.round_id,
                code: r.code,
                name: r.name,
                description: r.description,
                display_order: r.display_order,
                eligibility_scope: r.eligibility_scope,
                is_active: r.is_active,
                status: r.status,
            })
            .collect())
    }
    async fn criteria(&self, judge: Uuid, pageant: Uuid) -> Result<Vec<Criterion>, AppError> {
        verify(&self.pool, judge, pageant).await?;
        let rows=sqlx::query_as::<_,CriterionRow>("SELECT DISTINCT criterion.id,criterion.pageant_id,criterion.code,criterion.name,criterion.description,criterion.default_maximum_score,criterion.default_minimum_score,criterion.is_active FROM criteria criterion JOIN round_criteria rc ON rc.criterion_id=criterion.id JOIN pageant_rounds round ON round.id=rc.round_id WHERE criterion.pageant_id=$1 AND round.status='OPEN'::round_status ORDER BY criterion.name,criterion.id").bind(pageant).fetch_all(&self.pool).await.map_err(db)?;
        Ok(rows
            .into_iter()
            .map(|r| Criterion {
                id: r.id,
                pageant_id: r.pageant_id,
                code: r.code,
                name: r.name,
                description: r.description,
                default_maximum_score: r.default_maximum_score,
                default_minimum_score: r.default_minimum_score,
                is_active: r.is_active,
            })
            .collect())
    }

    async fn category_scoring(
        &self,
        judge: Uuid,
        pageant: Uuid,
        round_id: Uuid,
        category_id: Uuid,
    ) -> Result<CategoryScoringWorkspace, AppError> {
        verify(&self.pool, judge, pageant).await?;
        let category = sqlx::query_as::<_, ScoringCategoryRow>(
            "SELECT round.name AS round_name, category.name AS category_name, category.eligibility_scope \
             FROM pageant_rounds round \
             INNER JOIN pageant_round_categories round_category ON round_category.round_id = round.id AND round_category.pageant_id = round.pageant_id \
             INNER JOIN pageant_categories category ON category.id = round_category.category_id \
             WHERE round.id = $1 AND round.pageant_id = $2 AND round.status = 'OPEN'::round_status \
               AND category.id = $3 AND category.pageant_id = $2 AND category.is_active = TRUE \
               AND category.status = 'OPEN'",
        ).bind(round_id).bind(pageant).bind(category_id).fetch_optional(&self.pool).await.map_err(db)?
            .ok_or(AppError::Forbidden)?;

        let criteria = sqlx::query_as::<_, ScoringCriterionRow>(
            "SELECT rc.id AS round_criterion_id, criterion.id AS criterion_id, criterion.name, criterion.description, \
                    rc.minimum_score, rc.maximum_score, rc.weight_percentage, rc.display_order \
             FROM round_criteria rc INNER JOIN criteria criterion ON criterion.id = rc.criterion_id \
             WHERE rc.round_id = $1 AND rc.category_id = $2 AND criterion.is_active = TRUE \
             ORDER BY rc.display_order, criterion.name, criterion.id",
        ).bind(round_id).bind(category_id).fetch_all(&self.pool).await.map_err(db)?
            .into_iter().map(|row| ScoringCriterion { round_criterion_id: row.round_criterion_id, criterion_id: row.criterion_id, name: row.name, description: row.description, minimum_score: row.minimum_score, maximum_score: row.maximum_score, weight_percentage: row.weight_percentage, display_order: row.display_order }).collect::<Vec<_>>();

        let candidates = sqlx::query_as::<_, ScoringCandidateRow>(
            "SELECT contestant.id, contestant.contestant_number, contestant.display_name, contestant.gender, contestant.photo_url, contestant.biography \
             FROM contestants contestant INNER JOIN pageant_categories category ON category.id = $2 \
             WHERE contestant.pageant_id = $1 AND contestant.is_active = TRUE \
               AND (category.eligibility_scope IN ('OPEN', 'CUSTOM') \
                    OR (category.eligibility_scope = 'MEN' AND LOWER(COALESCE(contestant.gender, '')) = 'male') \
                    OR (category.eligibility_scope IN ('WOMEN', 'LGBTQ_PLUS') AND LOWER(COALESCE(contestant.gender, '')) <> 'male')) \
             ORDER BY CASE WHEN LOWER(COALESCE(contestant.gender, '')) = 'male' THEN 1 ELSE 0 END, contestant.contestant_number, contestant.display_name",
        ).bind(pageant).bind(category_id).fetch_all(&self.pool).await.map_err(db)?;

        let assignment = sqlx::query_as::<_, (Uuid, String)>("SELECT id, status::text FROM judge_assignments WHERE pageant_id = $1 AND round_id = $2 AND judge_user_id = $3")
            .bind(pageant).bind(round_id).bind(judge).fetch_optional(&self.pool).await.map_err(db)?;
        let mut candidate_scores: HashMap<Uuid, (Option<String>, Vec<SavedCriterionScore>)> =
            HashMap::new();
        if let Some((assignment_id, assignment_status)) = assignment {
            if assignment_status == "ACTIVE" {
                let saved = sqlx::query_as::<_, SavedScoreRow>(
                    "SELECT sheet.contestant_id, sheet.status::text AS submission_status, score.round_criterion_id, score.raw_score \
                     FROM score_sheets sheet INNER JOIN judge_scores score ON score.score_sheet_id = sheet.id \
                     INNER JOIN round_criteria rc ON rc.id = score.round_criterion_id \
                     WHERE sheet.judge_assignment_id = $1 AND sheet.category_id = $3 AND rc.round_id = $2 AND rc.category_id = $3 \
                       AND sheet.status <> 'VOIDED'::score_sheet_status ORDER BY score.round_criterion_id",
                ).bind(assignment_id).bind(round_id).bind(category_id).fetch_all(&self.pool).await.map_err(db)?;
                for row in saved {
                    let item = candidate_scores
                        .entry(row.contestant_id)
                        .or_insert_with(|| (Some(row.submission_status), Vec::new()));
                    item.1.push(SavedCriterionScore {
                        round_criterion_id: row.round_criterion_id,
                        raw_score: row.raw_score,
                    });
                }
                let statuses = sqlx::query_as::<_, (Uuid, String)>("SELECT contestant_id, status::text FROM score_sheets WHERE judge_assignment_id = $1 AND category_id = $2 AND status <> 'VOIDED'::score_sheet_status")
                    .bind(assignment_id).bind(category_id).fetch_all(&self.pool).await.map_err(db)?;
                for (contestant_id, status) in statuses {
                    let entry = candidate_scores
                        .entry(contestant_id)
                        .or_insert_with(|| (None, Vec::new()));
                    entry.0 = Some(status);
                }
            }
        }

        Ok(CategoryScoringWorkspace {
            round_id,
            round_name: category.round_name,
            category_id,
            category_name: category.category_name,
            eligibility_scope: category.eligibility_scope,
            criteria,
            candidates: candidates
                .into_iter()
                .map(|candidate| {
                    let (submission_status, scores) = candidate_scores
                        .remove(&candidate.id)
                        .unwrap_or((None, Vec::new()));
                    ScoringCandidate {
                        id: candidate.id,
                        contestant_number: candidate.contestant_number,
                        display_name: candidate.display_name,
                        gender: candidate.gender,
                        photo_url: candidate.photo_url,
                        biography: candidate.biography,
                        submission_status,
                        scores,
                    }
                })
                .collect(),
        })
    }

    async fn save_category_score_draft(
        &self,
        judge: Uuid,
        pageant: Uuid,
        round_id: Uuid,
        category_id: Uuid,
        contestant_id: Uuid,
        scores: Vec<CriterionScoreInput>,
    ) -> Result<ScoreSubmissionResult, AppError> {
        verify(&self.pool, judge, pageant).await?;
        let mut tx = self.pool.begin().await.map_err(db)?;
        let category_scope = sqlx::query_scalar::<_, String>(
            "SELECT category.eligibility_scope FROM pageant_rounds round \
             INNER JOIN pageant_round_categories round_category ON round_category.round_id = round.id AND round_category.pageant_id = round.pageant_id \
             INNER JOIN pageant_categories category ON category.id = round_category.category_id \
             WHERE round.id = $1 AND round.pageant_id = $2 AND round.status = 'OPEN'::round_status \
               AND category.id = $3 AND category.is_active = TRUE AND category.status = 'OPEN' \
             FOR UPDATE OF round, category",
        ).bind(round_id).bind(pageant).bind(category_id).fetch_optional(&mut *tx).await.map_err(db)?
            .ok_or(AppError::Forbidden)?;
        let eligible = sqlx::query_scalar::<_, bool>(
            "SELECT EXISTS (SELECT 1 FROM contestants contestant WHERE contestant.id = $1 AND contestant.pageant_id = $2 AND contestant.is_active = TRUE \
             AND ($3 IN ('OPEN', 'CUSTOM') OR ($3 = 'MEN' AND LOWER(COALESCE(contestant.gender, '')) = 'male') \
                  OR ($3 IN ('WOMEN', 'LGBTQ_PLUS') AND LOWER(COALESCE(contestant.gender, '')) <> 'male')))"
        ).bind(contestant_id).bind(pageant).bind(&category_scope).fetch_one(&mut *tx).await.map_err(db)?;
        if !eligible {
            return Err(AppError::BadRequest(
                "this candidate is not eligible for the selected category".to_owned(),
            ));
        }

        let expected = sqlx::query_as::<_, CriterionBound>(
            "SELECT rc.id, rc.minimum_score, rc.maximum_score, rc.weight_percentage FROM round_criteria rc \
             INNER JOIN criteria criterion ON criterion.id = rc.criterion_id \
             WHERE rc.round_id = $1 AND rc.category_id = $2 AND criterion.is_active = TRUE",
        ).bind(round_id).bind(category_id).fetch_all(&mut *tx).await.map_err(db)?;
        if expected.is_empty() {
            return Err(AppError::BadRequest(
                "this category has no active scoring criteria".to_owned(),
            ));
        }
        let submitted_ids = scores
            .iter()
            .map(|score| score.round_criterion_id)
            .collect::<HashSet<_>>();
        if submitted_ids.len() != scores.len()
            || scores.iter().any(|score| {
                !expected
                    .iter()
                    .any(|criterion| criterion.id == score.round_criterion_id)
            })
        {
            return Err(AppError::BadRequest(
                "one or more scores do not belong to this category".to_owned(),
            ));
        }
        for score in &scores {
            let criterion = expected
                .iter()
                .find(|criterion| criterion.id == score.round_criterion_id)
                .expect("criterion ids were checked");
            if score.raw_score < criterion.minimum_score
                || score.raw_score > criterion.maximum_score
            {
                return Err(AppError::BadRequest(format!(
                    "scores must be between {} and {}",
                    criterion.minimum_score, criterion.maximum_score
                )));
            }
        }

        let created_assignment = sqlx::query_scalar::<_, Uuid>(
            "INSERT INTO judge_assignments (pageant_id, round_id, judge_user_id, status) VALUES ($1, $2, $3, 'ACTIVE'::assignment_status) \
             ON CONFLICT (round_id, judge_user_id) DO NOTHING RETURNING id",
        ).bind(pageant).bind(round_id).bind(judge).fetch_optional(&mut *tx).await.map_err(db)?;
        let (assignment_id, assignment_status) = if let Some(id) = created_assignment {
            (id, "ACTIVE".to_owned())
        } else {
            sqlx::query_as::<_, (Uuid, String)>("SELECT id, status::text FROM judge_assignments WHERE round_id = $1 AND judge_user_id = $2 FOR UPDATE")
                .bind(round_id).bind(judge).fetch_one(&mut *tx).await.map_err(db)?
        };
        if assignment_status != "ACTIVE" {
            return Err(AppError::Forbidden);
        }
        let created_sheet = sqlx::query_scalar::<_, Uuid>(
            "INSERT INTO score_sheets (judge_assignment_id, contestant_id, category_id, status) VALUES ($1, $2, $3, 'DRAFT'::score_sheet_status) \
             ON CONFLICT (judge_assignment_id, contestant_id, category_id) DO NOTHING RETURNING id",
        ).bind(assignment_id).bind(contestant_id).bind(category_id).fetch_optional(&mut *tx).await.map_err(db)?;
        let (sheet_id, sheet_status) = if let Some(id) = created_sheet {
            (id, "DRAFT".to_owned())
        } else {
            sqlx::query_as::<_, (Uuid, String)>("SELECT id, status::text FROM score_sheets WHERE judge_assignment_id = $1 AND contestant_id = $2 AND category_id = $3 FOR UPDATE")
                .bind(assignment_id).bind(contestant_id).bind(category_id).fetch_one(&mut *tx).await.map_err(db)?
        };
        if sheet_status != "DRAFT" {
            return Err(AppError::Conflict(
                "scores for this candidate have already been submitted".to_owned(),
            ));
        }
        for score in scores {
            let criterion = expected
                .iter()
                .find(|criterion| criterion.id == score.round_criterion_id)
                .expect("criterion ids were checked");
            let normalized = if criterion.maximum_score == criterion.minimum_score {
                Decimal::from(100)
            } else {
                (score.raw_score - criterion.minimum_score) * Decimal::from(100)
                    / (criterion.maximum_score - criterion.minimum_score)
            };
            let weighted = normalized * criterion.weight_percentage / Decimal::from(100);
            sqlx::query("INSERT INTO judge_scores (score_sheet_id, round_criterion_id, raw_score, normalized_score, weighted_score) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (score_sheet_id, round_criterion_id) DO UPDATE SET raw_score = EXCLUDED.raw_score, normalized_score = EXCLUDED.normalized_score, weighted_score = EXCLUDED.weighted_score")
                .bind(sheet_id).bind(score.round_criterion_id).bind(score.raw_score).bind(normalized).bind(weighted).execute(&mut *tx).await.map_err(db)?;
        }
        let saved_at = Utc::now();
        tx.commit().await.map_err(db)?;
        Ok(ScoreSubmissionResult {
            contestant_id,
            status: "DRAFT".to_owned(),
            saved_at,
        })
    }

    async fn submit_category_scores(
        &self,
        judge: Uuid,
        pageant: Uuid,
        round_id: Uuid,
        category_id: Uuid,
    ) -> Result<CategorySubmissionResult, AppError> {
        verify(&self.pool, judge, pageant).await?;
        let mut tx = self.pool.begin().await.map_err(db)?;
        let category_scope = sqlx::query_scalar::<_, String>(
            "SELECT category.eligibility_scope FROM pageant_rounds round \
             INNER JOIN pageant_round_categories round_category ON round_category.round_id = round.id AND round_category.pageant_id = round.pageant_id \
             INNER JOIN pageant_categories category ON category.id = round_category.category_id \
             WHERE round.id = $1 AND round.pageant_id = $2 AND round.status = 'OPEN'::round_status \
               AND category.id = $3 AND category.is_active = TRUE AND category.status = 'OPEN' \
             FOR UPDATE OF round, category",
        )
        .bind(round_id)
        .bind(pageant)
        .bind(category_id)
        .fetch_optional(&mut *tx)
        .await
        .map_err(db)?
        .ok_or(AppError::Forbidden)?;

        let criteria = sqlx::query_as::<_, CriterionBound>(
            "SELECT rc.id, rc.minimum_score, rc.maximum_score, rc.weight_percentage FROM round_criteria rc \
             INNER JOIN criteria criterion ON criterion.id = rc.criterion_id \
             WHERE rc.round_id = $1 AND rc.category_id = $2 AND criterion.is_active = TRUE",
        )
        .bind(round_id)
        .bind(category_id)
        .fetch_all(&mut *tx)
        .await
        .map_err(db)?;
        if criteria.is_empty() {
            return Err(AppError::BadRequest(
                "this category has no active criteria to submit".to_owned(),
            ));
        }

        let candidates = sqlx::query_as::<_, (Uuid, i32)>(
            "SELECT contestant.id, contestant.contestant_number FROM contestants contestant \
             WHERE contestant.pageant_id = $1 AND contestant.is_active = TRUE \
               AND ($2 IN ('OPEN', 'CUSTOM') OR ($2 = 'MEN' AND LOWER(COALESCE(contestant.gender, '')) = 'male') \
                    OR ($2 IN ('WOMEN', 'LGBTQ_PLUS') AND LOWER(COALESCE(contestant.gender, '')) <> 'male')) \
             ORDER BY contestant.contestant_number, contestant.id",
        )
        .bind(pageant)
        .bind(&category_scope)
        .fetch_all(&mut *tx)
        .await
        .map_err(db)?;
        if candidates.is_empty() {
            return Err(AppError::BadRequest(
                "there are no eligible candidates in this category".to_owned(),
            ));
        }

        let assignment = sqlx::query_as::<_, (Uuid, String)>(
            "SELECT id, status::text FROM judge_assignments WHERE pageant_id = $1 AND round_id = $2 AND judge_user_id = $3 FOR UPDATE",
        )
        .bind(pageant)
        .bind(round_id)
        .bind(judge)
        .fetch_optional(&mut *tx)
        .await
        .map_err(db)?
        .ok_or_else(|| AppError::BadRequest("save scores for every eligible candidate before submitting this category".to_owned()))?;
        if assignment.1 != "ACTIVE" {
            return Err(AppError::Forbidden);
        }

        let expected_ids = criteria
            .iter()
            .map(|criterion| criterion.id)
            .collect::<HashSet<_>>();
        let mut sheet_ids = Vec::new();
        for (contestant_id, contestant_number) in &candidates {
            let sheet = sqlx::query_as::<_, (Uuid, String)>(
                "SELECT id, status::text FROM score_sheets WHERE judge_assignment_id = $1 AND contestant_id = $2 AND category_id = $3 FOR UPDATE",
            )
            .bind(assignment.0)
            .bind(contestant_id)
            .bind(category_id)
            .fetch_optional(&mut *tx)
            .await
            .map_err(db)?;
            let Some((sheet_id, status)) = sheet else {
                return Err(AppError::BadRequest(format!(
                    "contestant #{contestant_number} has no saved scores yet"
                )));
            };
            let scored = sqlx::query_as::<_, (Uuid, Decimal)>(
                "SELECT round_criterion_id, raw_score FROM judge_scores WHERE score_sheet_id = $1",
            )
            .bind(sheet_id)
            .fetch_all(&mut *tx)
            .await
            .map_err(db)?;
            let scored_ids = scored.iter().map(|(id, _)| *id).collect::<HashSet<_>>();
            let complete = scored_ids.len() == expected_ids.len() && expected_ids == scored_ids;
            let in_range = scored.iter().all(|(id, score)| {
                criteria
                    .iter()
                    .find(|criterion| criterion.id == *id)
                    .is_some_and(|criterion| {
                        *score >= criterion.minimum_score && *score <= criterion.maximum_score
                    })
            });
            if !complete || !in_range {
                return Err(AppError::BadRequest(format!(
                    "contestant #{contestant_number} has missing, duplicate, or invalid scores"
                )));
            }
            if status != "DRAFT" && status != "SUBMITTED" {
                return Err(AppError::Conflict(format!(
                    "contestant #{contestant_number} score sheet cannot be submitted"
                )));
            }
            if status == "DRAFT" {
                sheet_ids.push(sheet_id);
            }
        }

        let submitted_at = Utc::now();
        if !sheet_ids.is_empty() {
            sqlx::query("UPDATE score_sheets SET status = 'SUBMITTED'::score_sheet_status, submitted_at = $2 WHERE id = ANY($1)")
                .bind(&sheet_ids)
                .bind(submitted_at)
                .execute(&mut *tx)
                .await
                .map_err(db)?;
        }
        tx.commit().await.map_err(db)?;
        Ok(CategorySubmissionResult {
            category_id,
            status: "SUBMITTED".to_owned(),
            candidate_count: candidates.len(),
            submitted_at,
        })
    }
}
