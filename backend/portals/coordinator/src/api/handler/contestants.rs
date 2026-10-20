use actix_web::{HttpMessage, HttpRequest, HttpResponse, web};
use core_auth::domain::models::authenticated_user::AuthenticatedUser;
use core_infra::AppError;
use serde::Deserialize;
use uuid::Uuid;
use validator::Validate;

use crate::{
    application::contestants::ContestantApplication,
    contracts::contestants::{
        ContestantPlacementsRequest, ContestantPlacementsResponse, ContestantRequest,
        ContestantResponse,
    },
};

#[derive(Deserialize)]
pub struct PageantPath {
    pageant_id: Uuid,
}

#[derive(Deserialize)]
pub struct ContestantPath {
    pageant_id: Uuid,
    contestant_id: Uuid,
}

fn actor_id(request: &HttpRequest) -> Result<Uuid, AppError> {
    request
        .extensions()
        .get::<AuthenticatedUser>()
        .map(|user| user.user_id)
        .ok_or(AppError::Unauthorized)
}

pub async fn list(
    request: HttpRequest,
    application: web::Data<ContestantApplication>,
    path: web::Path<PageantPath>,
) -> Result<HttpResponse, AppError> {
    let contestants = application
        .list(actor_id(&request)?, path.pageant_id)
        .await?;
    Ok(HttpResponse::Ok().json(
        contestants
            .into_iter()
            .map(ContestantResponse::from)
            .collect::<Vec<_>>(),
    ))
}

pub async fn get(
    request: HttpRequest,
    application: web::Data<ContestantApplication>,
    path: web::Path<ContestantPath>,
) -> Result<HttpResponse, AppError> {
    let contestant = application
        .get(actor_id(&request)?, path.pageant_id, path.contestant_id)
        .await?;
    Ok(HttpResponse::Ok().json(ContestantResponse::from(contestant)))
}

pub async fn create(
    request: HttpRequest,
    application: web::Data<ContestantApplication>,
    path: web::Path<PageantPath>,
    body: web::Json<ContestantRequest>,
) -> Result<HttpResponse, AppError> {
    body.validate()?;
    let contestant = application
        .create(actor_id(&request)?, path.pageant_id, body.into_inner())
        .await?;
    Ok(HttpResponse::Created().json(ContestantResponse::from(contestant)))
}

pub async fn update(
    request: HttpRequest,
    application: web::Data<ContestantApplication>,
    path: web::Path<ContestantPath>,
    body: web::Json<ContestantRequest>,
) -> Result<HttpResponse, AppError> {
    body.validate()?;
    let contestant = application
        .update(
            actor_id(&request)?,
            path.pageant_id,
            path.contestant_id,
            body.into_inner(),
        )
        .await?;
    Ok(HttpResponse::Ok().json(ContestantResponse::from(contestant)))
}

pub async fn deactivate(
    request: HttpRequest,
    application: web::Data<ContestantApplication>,
    path: web::Path<ContestantPath>,
) -> Result<HttpResponse, AppError> {
    application
        .deactivate(actor_id(&request)?, path.pageant_id, path.contestant_id)
        .await?;
    Ok(HttpResponse::NoContent().finish())
}

pub async fn get_placements(
    request: HttpRequest,
    application: web::Data<ContestantApplication>,
    path: web::Path<ContestantPath>,
) -> Result<HttpResponse, AppError> {
    let value = application
        .get_placements(actor_id(&request)?, path.pageant_id, path.contestant_id)
        .await?;
    Ok(HttpResponse::Ok().json(ContestantPlacementsResponse::from(value)))
}

pub async fn save_placements(
    request: HttpRequest,
    application: web::Data<ContestantApplication>,
    path: web::Path<ContestantPath>,
    body: web::Json<ContestantPlacementsRequest>,
) -> Result<HttpResponse, AppError> {
    body.validate()?;
    let value = application
        .save_placements(
            actor_id(&request)?,
            path.pageant_id,
            path.contestant_id,
            body.into_inner(),
        )
        .await?;
    Ok(HttpResponse::Ok().json(ContestantPlacementsResponse::from(value)))
}
