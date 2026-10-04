use std::sync::Arc;

use core_infra::AppError;
use rust_decimal::Decimal;
use uuid::Uuid;

use crate::{
    application::ports::{
        subscription_workflow::SubscriptionWorkflow,
        vote_package_workflow::VotePackageWorkflow,
    },
    contracts::vote_packages::{CreateVotePackageRequest, UpdateVotePackageRequest},
    domain::vote_package::VotePackage,
};

pub struct VotePackageApplication {
    workflow: Arc<dyn VotePackageWorkflow>,
    subscription: Arc<dyn SubscriptionWorkflow>,
}

impl VotePackageApplication {
    pub fn new(
        workflow: Arc<dyn VotePackageWorkflow>,
        subscription: Arc<dyn SubscriptionWorkflow>,
    ) -> Self {
        Self { workflow, subscription }
    }

    pub async fn list(
        &self,
        organization_id: Uuid,
        pageant_id: Uuid,
    ) -> Result<Vec<VotePackage>, AppError> {
        self.workflow.list(organization_id, pageant_id).await
    }

    pub async fn create(
        &self,
        organization_id: Uuid,
        pageant_id: Uuid,
        created_by: Uuid,
        request: CreateVotePackageRequest,
    ) -> Result<VotePackage, AppError> {
        validate_package(
            &request.name,
            request.vote_quantity,
            request.price_amount,
            &request.currency,
        )?;

        // ── Subscription enforcement ──────────────────────────────────────────
        let plan = self
            .subscription
            .current_plan(organization_id)
            .await?
            .ok_or_else(|| AppError::BadRequest(
                "Your organization does not have an active subscription. \
                 Please subscribe to a plan before creating vote packages.".to_owned(),
            ))?;

        if !plan.public_voting_enabled {
            return Err(AppError::BadRequest(
                "Your current subscription plan does not support public voting. \
                 Upgrade to a plan with public voting enabled to create vote packages \
                 and collect audience voting revenue.".to_owned(),
            ));
        }
        // ─────────────────────────────────────────────────────────────────────

        self.workflow
            .create(
                organization_id,
                VotePackage {
                    id: Uuid::new_v4(),
                    pageant_id,
                    name: request.name.trim().to_owned(),
                    description: request.description,
                    vote_quantity: request.vote_quantity,
                    price_amount: request.price_amount,
                    currency: request.currency.trim().to_ascii_uppercase(),
                    is_active: true,
                    created_by: Some(created_by),
                },
            )
            .await
    }

    pub async fn update(
        &self,
        organization_id: Uuid,
        pageant_id: Uuid,
        package_id: Uuid,
        request: UpdateVotePackageRequest,
    ) -> Result<VotePackage, AppError> {
        validate_package(
            &request.name,
            request.vote_quantity,
            request.price_amount,
            &request.currency,
        )?;
        self.workflow
            .update(
                organization_id,
                VotePackage {
                    id: package_id,
                    pageant_id,
                    name: request.name.trim().to_owned(),
                    description: request.description,
                    vote_quantity: request.vote_quantity,
                    price_amount: request.price_amount,
                    currency: request.currency.trim().to_ascii_uppercase(),
                    is_active: true,
                    created_by: None,
                },
            )
            .await
    }

    pub async fn deactivate(
        &self,
        organization_id: Uuid,
        pageant_id: Uuid,
        package_id: Uuid,
    ) -> Result<(), AppError> {
        self.workflow
            .deactivate(organization_id, pageant_id, package_id)
            .await
    }
}

fn validate_package(
    name: &str,
    vote_quantity: i32,
    price_amount: Decimal,
    currency: &str,
) -> Result<(), AppError> {
    let name = name.trim();
    if name.is_empty() || name.len() > 150 {
        return Err(AppError::BadRequest(
            "name must be between 1 and 150 characters".to_owned(),
        ));
    }
    if vote_quantity <= 0 {
        return Err(AppError::BadRequest(
            "vote_quantity must be positive".to_owned(),
        ));
    }
    if price_amount < Decimal::ZERO
        || price_amount > Decimal::new(999_999_999_999, 2)
        || price_amount.scale() > 2
    {
        return Err(AppError::BadRequest(
            "price_amount must be between 0 and 9999999999.99 with at most 2 decimal places"
                .to_owned(),
        ));
    }
    if currency.len() != 3 || !currency.bytes().all(|byte| byte.is_ascii_alphabetic()) {
        return Err(AppError::BadRequest(
            "currency must be a 3-letter currency code".to_owned(),
        ));
    }
    Ok(())
}
