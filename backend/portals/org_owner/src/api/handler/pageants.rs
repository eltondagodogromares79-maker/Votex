use actix_web::{HttpMessage, HttpRequest, HttpResponse, web};
use core_auth::domain::models::authenticated_user::AuthenticatedUser;
use core_infra::AppError;
use serde::Deserialize;
use uuid::Uuid;
use validator::Validate;

use crate::{
    application::pageants::PageantApplication,
    contracts::pageants::{CreatePageantRequest, PageantResponse, UpdatePageantRequest},
};

#[derive(Deserialize)]
pub struct PageantPath {
    organization_id: Uuid,
    pageant_id: Uuid,
}

pub async fn create_pageant(
    request: HttpRequest,
    application: web::Data<PageantApplication>,
    organization_id: web::Path<uuid::Uuid>,
    body: web::Json<CreatePageantRequest>,
) -> Result<HttpResponse, AppError> {
    body.validate()?;
    let creator_id = request
        .extensions()
        .get::<AuthenticatedUser>()
        .map(|user| user.user_id)
        .ok_or(AppError::Unauthorized)?;

    let result = application
        .create(organization_id.into_inner(), creator_id, body.into_inner())
        .await?;

    Ok(HttpResponse::Created().json(PageantResponse::from(result)))
}

pub async fn list_pageants(
    application: web::Data<PageantApplication>,
    organization_id: web::Path<Uuid>,
) -> Result<HttpResponse, AppError> {
    let pageants = application.list(organization_id.into_inner()).await?;
    Ok(HttpResponse::Ok().json(
        pageants
            .into_iter()
            .map(PageantResponse::from)
            .collect::<Vec<_>>(),
    ))
}

pub async fn get_pageant(
    application: web::Data<PageantApplication>,
    path: web::Path<PageantPath>,
) -> Result<HttpResponse, AppError> {
    let path = path.into_inner();
    let pageant = application
        .get(path.organization_id, path.pageant_id)
        .await?;
    Ok(HttpResponse::Ok().json(PageantResponse::from(pageant)))
}

pub async fn update_pageant(
    application: web::Data<PageantApplication>,
    path: web::Path<PageantPath>,
    body: web::Json<UpdatePageantRequest>,
) -> Result<HttpResponse, AppError> {
    body.validate()?;
    let path = path.into_inner();
    let pageant = application
        .update(path.organization_id, path.pageant_id, body.into_inner())
        .await?;
    Ok(HttpResponse::Ok().json(PageantResponse::from(pageant)))
}

pub async fn archive_pageant(
    application: web::Data<PageantApplication>,
    path: web::Path<PageantPath>,
) -> Result<HttpResponse, AppError> {
    let path = path.into_inner();
    application
        .archive(path.organization_id, path.pageant_id)
        .await?;
    Ok(HttpResponse::NoContent().finish())
}
