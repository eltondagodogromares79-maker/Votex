use crate::domain::legal_policy::LegalPolicy;
use async_trait::async_trait;
use core_infra::AppError;
use uuid::Uuid;

#[async_trait]
pub trait LegalPolicyWorkflow: Send + Sync {
    async fn list(&self) -> Result<Vec<LegalPolicy>, AppError>;
    async fn update(
        &self,
        slug: &str,
        title: &str,
        intro: &str,
        body: &str,
        updated_by: Uuid,
    ) -> Result<Option<LegalPolicy>, AppError>;
}
