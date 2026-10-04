use actix_web::{HttpMessage, HttpRequest, HttpResponse, web};
use core_auth::domain::models::authenticated_user::AuthenticatedUser;
use core_infra::AppError;
use serde::Deserialize;
use uuid::Uuid;
use validator::Validate;

use crate::{
    application::pageant_setup::PageantSetupApplication,
    contracts::pageant_setup::{
        CategoryRequest, CategoryResponse, CriterionRequest, CriterionResponse,
    },
};

#[derive(Deserialize)]
pub struct PageantPath {
    pageant_id: Uuid,
}

#[derive(Deserialize)]
pub struct CategoryPath {
    pageant_id: Uuid,
    category_id: Uuid,
}

#[derive(Deserialize)]
pub struct CriterionPath {
    pageant_id: Uuid,
    criterion_id: Uuid,
}

fn actor_id(request: &HttpRequest) -> Result<Uuid, AppError> {
    request
        .extensions()
        .get::<AuthenticatedUser>()
        .map(|user| user.user_id)
        .ok_or(AppError::Unauthorized)
}

pub async fn list_categories(
    request: HttpRequest,
    application: web::Data<PageantSetupApplication>,
    path: web::Path<PageantPath>,
) -> Result<HttpResponse, AppError> {
    let categories = application
        .list_categories(actor_id(&request)?, path.pageant_id)
        .await?;
    Ok(HttpResponse::Ok().json(
        categories
            .into_iter()
            .map(CategoryResponse::from)
            .collect::<Vec<_>>(),
    ))
}

pub async fn get_category(
    request: HttpRequest,
    application: web::Data<PageantSetupApplication>,
    path: web::Path<CategoryPath>,
) -> Result<HttpResponse, AppError> {
    let category = application
        .get_category(actor_id(&request)?, path.pageant_id, path.category_id)
        .await?;
    Ok(HttpResponse::Ok().json(CategoryResponse::from(category)))
}

pub async fn create_category(
    request: HttpRequest,
    application: web::Data<PageantSetupApplication>,
    path: web::Path<PageantPath>,
    body: web::Json<CategoryRequest>,
) -> Result<HttpResponse, AppError> {
    body.validate()?;
    let category = application
        .create_category(actor_id(&request)?, path.pageant_id, body.into_inner())
        .await?;
    Ok(HttpResponse::Created().json(CategoryResponse::from(category)))
}

pub async fn update_category(
    request: HttpRequest,
    application: web::Data<PageantSetupApplication>,
    path: web::Path<CategoryPath>,
    body: web::Json<CategoryRequest>,
) -> Result<HttpResponse, AppError> {
    body.validate()?;
    let category = application
        .update_category(
            actor_id(&request)?,
            path.pageant_id,
            path.category_id,
            body.into_inner(),
        )
        .await?;
    Ok(HttpResponse::Ok().json(CategoryResponse::from(category)))
}

pub async fn deactivate_category(
    request: HttpRequest,
    application: web::Data<PageantSetupApplication>,
    path: web::Path<CategoryPath>,
) -> Result<HttpResponse, AppError> {
    application
        .deactivate_category(actor_id(&request)?, path.pageant_id, path.category_id)
        .await?;
    Ok(HttpResponse::NoContent().finish())
}

pub async fn list_criteria(
    request: HttpRequest,
    application: web::Data<PageantSetupApplication>,
    path: web::Path<PageantPath>,
) -> Result<HttpResponse, AppError> {
    let criteria = application
        .list_criteria(actor_id(&request)?, path.pageant_id)
        .await?;
    Ok(HttpResponse::Ok().json(
        criteria
            .into_iter()
            .map(CriterionResponse::from)
            .collect::<Vec<_>>(),
    ))
}

pub async fn get_criterion(
    request: HttpRequest,
    application: web::Data<PageantSetupApplication>,
    path: web::Path<CriterionPath>,
) -> Result<HttpResponse, AppError> {
    let criterion = application
        .get_criterion(actor_id(&request)?, path.pageant_id, path.criterion_id)
        .await?;
    Ok(HttpResponse::Ok().json(CriterionResponse::from(criterion)))
}

pub async fn create_criterion(
    request: HttpRequest,
    application: web::Data<PageantSetupApplication>,
    path: web::Path<PageantPath>,
    body: web::Json<CriterionRequest>,
) -> Result<HttpResponse, AppError> {
    body.validate()?;
    let criterion = application
        .create_criterion(actor_id(&request)?, path.pageant_id, body.into_inner())
        .await?;
    Ok(HttpResponse::Created().json(CriterionResponse::from(criterion)))
}

pub async fn update_criterion(
    request: HttpRequest,
    application: web::Data<PageantSetupApplication>,
    path: web::Path<CriterionPath>,
    body: web::Json<CriterionRequest>,
) -> Result<HttpResponse, AppError> {
    body.validate()?;
    let criterion = application
        .update_criterion(
            actor_id(&request)?,
            path.pageant_id,
            path.criterion_id,
            body.into_inner(),
        )
        .await?;
    Ok(HttpResponse::Ok().json(CriterionResponse::from(criterion)))
}

pub async fn deactivate_criterion(
    request: HttpRequest,
    application: web::Data<PageantSetupApplication>,
    path: web::Path<CriterionPath>,
) -> Result<HttpResponse, AppError> {
    application
        .deactivate_criterion(actor_id(&request)?, path.pageant_id, path.criterion_id)
        .await?;
    Ok(HttpResponse::NoContent().finish())
}
