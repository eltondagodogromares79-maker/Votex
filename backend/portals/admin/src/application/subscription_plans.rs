use std::sync::Arc;

use core_infra::AppError;
use uuid::Uuid;

use crate::{
    application::ports::subscription_plan_workflow::SubscriptionPlanWorkflow,
    contracts::subscription_plans::SubscriptionPlanRequest,
    domain::subscription_plan::SubscriptionPlan,
};

pub struct SubscriptionPlanApplication {
    workflow: Arc<dyn SubscriptionPlanWorkflow>,
}

impl SubscriptionPlanApplication {
    pub fn new(workflow: Arc<dyn SubscriptionPlanWorkflow>) -> Self {
        Self { workflow }
    }

    pub async fn list(&self) -> Result<Vec<SubscriptionPlan>, AppError> {
        self.workflow.list().await
    }

    pub async fn get(&self, id: Uuid) -> Result<SubscriptionPlan, AppError> {
        self.workflow.get(id).await
    }

    pub async fn create(
        &self,
        request: SubscriptionPlanRequest,
    ) -> Result<SubscriptionPlan, AppError> {
        self.workflow
            .create(to_plan(Uuid::new_v4(), request)?)
            .await
    }

    pub async fn update(
        &self,
        id: Uuid,
        request: SubscriptionPlanRequest,
    ) -> Result<SubscriptionPlan, AppError> {
        self.workflow.update(to_plan(id, request)?).await
    }

    pub async fn deactivate(&self, id: Uuid) -> Result<(), AppError> {
        self.workflow.deactivate(id).await
    }
}

fn to_plan(id: Uuid, request: SubscriptionPlanRequest) -> Result<SubscriptionPlan, AppError> {
    let code = request.code.trim().to_ascii_uppercase();
    let name = request.name.trim().to_owned();
    let currency = request.currency.trim().to_ascii_uppercase();

    if code.is_empty()
        || code.len() > 50
        || !code
            .bytes()
            .all(|byte| byte.is_ascii_uppercase() || byte.is_ascii_digit() || byte == b'_')
    {
        return Err(AppError::BadRequest(
            "code must contain 1-50 uppercase letters, numbers, or underscores".to_owned(),
        ));
    }
    if name.is_empty() || name.len() > 150 {
        return Err(AppError::BadRequest(
            "name must be between 1 and 150 characters".to_owned(),
        ));
    }
    if request.price_amount.is_sign_negative() {
        return Err(AppError::BadRequest(
            "price_amount cannot be negative".to_owned(),
        ));
    }
    if currency.len() != 3 || !currency.bytes().all(|byte| byte.is_ascii_uppercase()) {
        return Err(AppError::BadRequest(
            "currency must be a three-letter ISO currency code".to_owned(),
        ));
    }
    for (field, value) in [
        ("billing_interval_months", request.billing_interval_months),
        ("max_pageants", request.max_pageants),
        ("max_tabulator_users", request.max_tabulator_users),
        ("max_judges_per_pageant", request.max_judges_per_pageant),
        ("max_rounds_per_pageant", request.max_rounds_per_pageant),
        ("max_categories_per_round", request.max_categories_per_round),
    ] {
        if value.is_some_and(|value| value <= 0) {
            return Err(AppError::BadRequest(format!(
                "{field} must be greater than zero"
            )));
        }
    }

    Ok(SubscriptionPlan {
        id,
        code,
        name,
        kind: request.kind,
        price_amount: request.price_amount,
        currency,
        billing_interval_months: request.billing_interval_months,
        max_pageants: request.max_pageants,
        max_tabulator_users: request.max_tabulator_users,
        max_judges_per_pageant: request.max_judges_per_pageant,
        max_rounds_per_pageant: request.max_rounds_per_pageant,
        max_categories_per_round: request.max_categories_per_round,
        public_voting_enabled: request.public_voting_enabled,
        customization_enabled: request.customization_enabled,
        is_active: request.is_active,
    })
}
