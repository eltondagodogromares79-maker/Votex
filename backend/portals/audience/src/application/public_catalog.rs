use crate::{
    application::ports::public_catalog_workflow::PublicCatalogWorkflow,
    domain::public_catalog::{PublicPageant, PublicPageantDetails, PublicSubscriptionPlan},
};
use core_infra::AppError;
use std::sync::Arc;

pub struct PublicCatalogApplication {
    workflow: Arc<dyn PublicCatalogWorkflow>,
}

impl PublicCatalogApplication {
    pub fn new(workflow: Arc<dyn PublicCatalogWorkflow>) -> Self {
        Self { workflow }
    }

    pub async fn pageants(&self) -> Result<Vec<PublicPageant>, AppError> {
        self.workflow.list_public_pageants().await
    }

    pub async fn plans(&self) -> Result<Vec<PublicSubscriptionPlan>, AppError> {
        self.workflow.list_active_plans().await
    }

    pub async fn pageant(&self, slug: &str) -> Result<Option<PublicPageantDetails>, AppError> {
        self.workflow.get_public_pageant(slug).await
    }
}
