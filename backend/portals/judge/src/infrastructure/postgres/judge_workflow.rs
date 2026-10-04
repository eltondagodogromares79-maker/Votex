use crate::{
    application::ports::judge_workflow::JudgeWorkflow,
    domain::{
        contestant::Contestant,
        pageant::AssignedPageant,
        round::Round,
        setup::{Category, Criterion},
    },
};
use async_trait::async_trait;
use chrono::{DateTime, NaiveDate, NaiveTime, Utc};
use core_infra::AppError;
use sqlx::{FromRow, PgPool};
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
    let assigned = sqlx::query_scalar::<_, bool>("SELECT EXISTS (SELECT 1 FROM pageant_member_roles a JOIN roles r ON r.id=a.role_id WHERE a.user_id=$1 AND a.pageant_id=$2 AND a.is_active=TRUE AND r.code='PAGEANT_JUDGE' AND r.scope='PAGEANT'::role_scope AND r.is_active=TRUE)")
        .bind(judge).bind(pageant).fetch_one(pool).await.map_err(db)?;
    if assigned {
        Ok(())
    } else {
        Err(AppError::NotFound("assigned pageant".into()))
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
    code: String,
    name: String,
    description: Option<String>,
    display_order: i32,
    is_active: bool,
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
        let rows=sqlx::query_as::<_,CategoryRow>("SELECT id,pageant_id,code,name,description,display_order,is_active FROM pageant_categories WHERE pageant_id=$1 ORDER BY display_order,name").bind(pageant).fetch_all(&self.pool).await.map_err(db)?;
        Ok(rows
            .into_iter()
            .map(|r| Category {
                id: r.id,
                pageant_id: r.pageant_id,
                code: r.code,
                name: r.name,
                description: r.description,
                display_order: r.display_order,
                is_active: r.is_active,
            })
            .collect())
    }
    async fn criteria(&self, judge: Uuid, pageant: Uuid) -> Result<Vec<Criterion>, AppError> {
        verify(&self.pool, judge, pageant).await?;
        let rows=sqlx::query_as::<_,CriterionRow>("SELECT id,pageant_id,code,name,description,default_maximum_score,default_minimum_score,is_active FROM criteria WHERE pageant_id=$1 ORDER BY name,id").bind(pageant).fetch_all(&self.pool).await.map_err(db)?;
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
}
