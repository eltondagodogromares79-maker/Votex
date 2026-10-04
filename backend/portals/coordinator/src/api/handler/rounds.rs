use actix_web::{HttpMessage, HttpRequest, HttpResponse, web};
use core_auth::domain::models::authenticated_user::AuthenticatedUser;
use core_infra::AppError;
use serde::Deserialize;
use uuid::Uuid;
use validator::Validate;

use crate::{
    application::rounds::RoundApplication,
    contracts::rounds::{CreateRoundRequest, RoundResponse, UpdateRoundRequest},
};

#[derive(Deserialize)]
pub struct PageantPath {
    pageant_id: Uuid,
}

#[derive(Deserialize)]
pub struct RoundPath {
    pageant_id: Uuid,
    round_id: Uuid,
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
    application: web::Data<RoundApplication>,
    path: web::Path<PageantPath>,
) -> Result<HttpResponse, AppError> {
    let rounds = application
        .list(actor_id(&request)?, path.pageant_id)
        .await?;
    Ok(HttpResponse::Ok().json(
        rounds
            .into_iter()
            .map(RoundResponse::from)
            .collect::<Vec<_>>(),
    ))
}

pub async fn get(
    request: HttpRequest,
    application: web::Data<RoundApplication>,
    path: web::Path<RoundPath>,
) -> Result<HttpResponse, AppError> {
    let round = application
        .get(actor_id(&request)?, path.pageant_id, path.round_id)
        .await?;
    Ok(HttpResponse::Ok().json(RoundResponse::from(round)))
}

pub async fn create(
    request: HttpRequest,
    application: web::Data<RoundApplication>,
    path: web::Path<PageantPath>,
    body: web::Json<CreateRoundRequest>,
) -> Result<HttpResponse, AppError> {
    body.validate()?;
    let round = application
        .create(actor_id(&request)?, path.pageant_id, body.into_inner())
        .await?;
    Ok(HttpResponse::Created().json(RoundResponse::from(round)))
}

pub async fn update(
    request: HttpRequest,
    application: web::Data<RoundApplication>,
    path: web::Path<RoundPath>,
    body: web::Json<UpdateRoundRequest>,
) -> Result<HttpResponse, AppError> {
    body.validate()?;
    let round = application
        .update(
            actor_id(&request)?,
            path.pageant_id,
            path.round_id,
            body.into_inner(),
        )
        .await?;
    Ok(HttpResponse::Ok().json(RoundResponse::from(round)))
}

pub async fn delete(
    request: HttpRequest,
    application: web::Data<RoundApplication>,
    path: web::Path<RoundPath>,
) -> Result<HttpResponse, AppError> {
    application
        .delete(actor_id(&request)?, path.pageant_id, path.round_id)
        .await?;
    Ok(HttpResponse::NoContent().finish())
}
