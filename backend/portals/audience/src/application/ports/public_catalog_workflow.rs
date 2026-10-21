use crate::domain::public_catalog::{
    PublicLegalPolicy, PublicPageant, PublicPageantDetails, PublicSubscriptionPlan,
};
use async_trait::async_trait;
use core_infra::AppError;

#[async_trait]
pub trait PublicCatalogWorkflow: Send + Sync {
    async fn list_public_pageants(&self) -> Result<Vec<PublicPageant>, AppError>;
    async fn get_public_pageant(
        &self,
        slug: &str,
    ) -> Result<Option<PublicPageantDetails>, AppError>;
    async fn list_active_plans(&self) -> Result<Vec<PublicSubscriptionPlan>, AppError>;
    async fn get_legal_policy(&self, slug: &str) -> Result<Option<PublicLegalPolicy>, AppError>;
}
