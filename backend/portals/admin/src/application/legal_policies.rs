use crate::{
    application::ports::legal_policy_workflow::LegalPolicyWorkflow,
    domain::legal_policy::LegalPolicy,
};
use core_infra::AppError;
use std::sync::Arc;
use uuid::Uuid;

pub struct LegalPolicyApplication {
    workflow: Arc<dyn LegalPolicyWorkflow>,
}
impl LegalPolicyApplication {
    pub fn new(workflow: Arc<dyn LegalPolicyWorkflow>) -> Self {
        Self { workflow }
    }
    pub async fn list(&self) -> Result<Vec<LegalPolicy>, AppError> {
        self.workflow.list().await
    }
    pub async fn update(
        &self,
        slug: &str,
        title: &str,
        intro: &str,
        body: &str,
        updated_by: Uuid,
    ) -> Result<LegalPolicy, AppError> {
        if !matches!(
            slug,
            "terms" | "privacy" | "refund-policy" | "cookie-policy"
        ) {
            return Err(AppError::NotFound("legal policy".into()));
        }
        let title = title.trim();
        let intro = intro.trim();
        let body = body.trim();
        if title.is_empty() || title.chars().count() > 160 {
            return Err(AppError::BadRequest(
                "Title must be between 1 and 160 characters.".into(),
            ));
        }
        if intro.chars().count() > 2000 {
            return Err(AppError::BadRequest(
                "Introduction cannot exceed 2,000 characters.".into(),
            ));
        }
        if body.is_empty() || body.chars().count() > 100_000 {
            return Err(AppError::BadRequest(
                "Policy content must be between 1 and 100,000 characters.".into(),
            ));
        }
        self.workflow
            .update(slug, title, intro, body, updated_by)
            .await?
            .ok_or_else(|| AppError::NotFound("legal policy".into()))
    }
}
