use actix_web::{HttpResponse, web};
use core_infra::AppError;
use uuid::Uuid;
use validator::Validate;

use crate::{
    application::subscription_plans::SubscriptionPlanApplication,
    contracts::subscription_plans::{SubscriptionPlanRequest, SubscriptionPlanResponse},
};

pub async fn list(
    application: web::Data<SubscriptionPlanApplication>,
) -> Result<HttpResponse, AppError> {
    let plans = application.list().await?;
    let response: Vec<SubscriptionPlanResponse> = plans
        .into_iter()
        .map(SubscriptionPlanResponse::from)
        .collect();
    Ok(HttpResponse::Ok().json(response))
}

pub async fn get(
    application: web::Data<SubscriptionPlanApplication>,
    id: web::Path<Uuid>,
) -> Result<HttpResponse, AppError> {
    let plan = application.get(id.into_inner()).await?;
    Ok(HttpResponse::Ok().json(SubscriptionPlanResponse::from(plan)))
}

pub async fn create(
    application: web::Data<SubscriptionPlanApplication>,
    body: web::Json<SubscriptionPlanRequest>,
) -> Result<HttpResponse, AppError> {
    body.validate()?;
    let plan = application.create(body.into_inner()).await?;
    Ok(HttpResponse::Created().json(SubscriptionPlanResponse::from(plan)))
}

pub async fn update(
    application: web::Data<SubscriptionPlanApplication>,
    id: web::Path<Uuid>,
    body: web::Json<SubscriptionPlanRequest>,
) -> Result<HttpResponse, AppError> {
    body.validate()?;
    let plan = application
        .update(id.into_inner(), body.into_inner())
        .await?;
    Ok(HttpResponse::Ok().json(SubscriptionPlanResponse::from(plan)))
}

pub async fn deactivate(
    application: web::Data<SubscriptionPlanApplication>,
    id: web::Path<Uuid>,
) -> Result<HttpResponse, AppError> {
    application.deactivate(id.into_inner()).await?;
    Ok(HttpResponse::NoContent().finish())
}
