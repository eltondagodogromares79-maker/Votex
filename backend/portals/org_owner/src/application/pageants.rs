use std::sync::Arc;

use core_infra::AppError;
use uuid::Uuid;

use crate::{
    application::ports::{
        pageant_workflow::PageantWorkflow,
        subscription_workflow::SubscriptionWorkflow,
    },
    contracts::pageants::{CreatePageantRequest, UpdatePageantRequest},
    domain::pageant::Pageant,
};

pub struct PageantApplication {
    workflow: Arc<dyn PageantWorkflow>,
    subscription: Arc<dyn SubscriptionWorkflow>,
}

impl PageantApplication {
    pub fn new(
        workflow: Arc<dyn PageantWorkflow>,
        subscription: Arc<dyn SubscriptionWorkflow>,
    ) -> Self {
        Self { workflow, subscription }
    }

    pub async fn create(
        &self,
        organization_id: Uuid,
        creator_id: Uuid,
        request: CreatePageantRequest,
    ) -> Result<Pageant, AppError> {
        let (name, slug) = validate_pageant_fields(
            &request.name,
            &request.slug,
            request.start_time,
            request.end_time,
        )?;

        // ── Subscription enforcement ──────────────────────────────────────────
        let plan = self
            .subscription
            .current_plan(organization_id)
            .await?
            .ok_or_else(|| AppError::BadRequest(
                "Your organization does not have an active subscription. \
                 Please subscribe to a plan before creating a pageant.".to_owned(),
            ))?;

        // Check max_pageants limit
        if let Some(max) = plan.max_pageants {
            let current_count = self.workflow.count_active_pageants(organization_id).await?;
            if current_count >= max as i64 {
                return Err(AppError::BadRequest(format!(
                    "Your current plan allows a maximum of {} pageant{}. \
                     You have reached this limit. Please upgrade your plan to create more pageants.",
                    max,
                    if max == 1 { "" } else { "s" },
                )));
            }
        }
        // ─────────────────────────────────────────────────────────────────────

        self.workflow
            .create_pageant(Pageant {
                id: Uuid::new_v4(),
                organization_id,
                created_by: creator_id,
                name,
                slug,
                description: request.description,
                logo_url: request.logo_url,
                event_date: request.event_date,
                start_time: request.start_time,
                end_time: request.end_time,
                venue: request.venue,
                status: "DRAFT".to_owned(),
                is_public: request.is_public,
            })
            .await
    }

    pub async fn list(&self, organization_id: Uuid) -> Result<Vec<Pageant>, AppError> {
        self.workflow.list_pageants(organization_id).await
    }

    pub async fn get(&self, organization_id: Uuid, pageant_id: Uuid) -> Result<Pageant, AppError> {
        self.workflow.get_pageant(organization_id, pageant_id).await
    }

    pub async fn update(
        &self,
        organization_id: Uuid,
        pageant_id: Uuid,
        request: UpdatePageantRequest,
    ) -> Result<Pageant, AppError> {
        let (name, slug) = validate_pageant_fields(
            &request.name,
            &request.slug,
            request.start_time,
            request.end_time,
        )?;
        let mut pageant = self
            .workflow
            .get_pageant(organization_id, pageant_id)
            .await?;
        if pageant.status == "ARCHIVED" {
            return Err(AppError::Conflict(
                "archived pageants cannot be updated".to_owned(),
            ));
        }
        pageant.name = name;
        pageant.slug = slug;
        pageant.description = request.description;
        pageant.logo_url = request.logo_url;
        pageant.event_date = request.event_date;
        pageant.start_time = request.start_time;
        pageant.end_time = request.end_time;
        pageant.venue = request.venue;
        pageant.is_public = request.is_public;
        self.workflow.update_pageant(pageant).await
    }

    pub async fn archive(&self, organization_id: Uuid, pageant_id: Uuid) -> Result<(), AppError> {
        self.workflow
            .archive_pageant(organization_id, pageant_id)
            .await
    }
}

fn validate_pageant_fields(
    raw_name: &str,
    raw_slug: &str,
    _start_time: Option<chrono::NaiveTime>,
    _end_time: Option<chrono::NaiveTime>,
) -> Result<(String, String), AppError> {
    let name = raw_name.trim().to_owned();
    let slug = raw_slug.trim().to_ascii_lowercase();
    if name.is_empty() || name.len() > 200 {
        return Err(AppError::BadRequest(
            "name must be between 1 and 200 characters".to_owned(),
        ));
    }
    if !(3..=100).contains(&slug.len())
        || !slug
            .bytes()
            .all(|byte| byte.is_ascii_lowercase() || byte.is_ascii_digit() || byte == b'-')
        || slug.starts_with('-')
        || slug.ends_with('-')
    {
        return Err(AppError::BadRequest(
            "slug must be 3-100 lowercase letters, numbers, and hyphens".to_owned(),
        ));
    }
    Ok((name, slug))
}
