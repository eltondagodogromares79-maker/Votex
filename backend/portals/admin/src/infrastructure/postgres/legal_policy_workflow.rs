use crate::{
    application::ports::legal_policy_workflow::LegalPolicyWorkflow,
    domain::legal_policy::LegalPolicy,
};
use async_trait::async_trait;
use core_infra::AppError;
use sqlx::PgPool;
use uuid::Uuid;

pub struct PostgresLegalPolicyWorkflow {
    pool: PgPool,
}
impl PostgresLegalPolicyWorkflow {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}
fn db(error: sqlx::Error) -> AppError {
    AppError::Database(Box::new(error))
}
#[async_trait]
impl LegalPolicyWorkflow for PostgresLegalPolicyWorkflow {
    async fn list(&self) -> Result<Vec<LegalPolicy>, AppError> {
        sqlx::query_as::<_, LegalPolicy>("SELECT id, slug, title, intro, body, version, updated_at FROM legal_policies ORDER BY slug").fetch_all(&self.pool).await.map_err(db)
    }
    async fn update(
        &self,
        slug: &str,
        title: &str,
        intro: &str,
        body: &str,
        updated_by: Uuid,
    ) -> Result<Option<LegalPolicy>, AppError> {
        sqlx::query_as::<_, LegalPolicy>("UPDATE legal_policies SET title = $2, intro = $3, body = $4, version = version + 1, updated_by = $5, updated_at = NOW() WHERE slug = $1 RETURNING id, slug, title, intro, body, version, updated_at")
            .bind(slug).bind(title).bind(intro).bind(body).bind(updated_by).fetch_optional(&self.pool).await.map_err(db)
    }
}
