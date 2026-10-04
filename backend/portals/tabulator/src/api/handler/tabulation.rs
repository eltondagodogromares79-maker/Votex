use crate::{
    application::tabulation::TabulationApplication,
    contracts::tabulation::{
        AdvancementResponse, AssignedPageantResponse, CategoryResponse, ContestantResponse,
        CriterionResponse, RoundResponse,
    },
};
use actix_web::{HttpMessage, HttpRequest, HttpResponse, web};
use core_auth::domain::models::authenticated_user::AuthenticatedUser;
use core_infra::AppError;
use uuid::Uuid;

fn user_id(req: &HttpRequest) -> Result<Uuid, AppError> {
    req.extensions()
        .get::<AuthenticatedUser>()
        .map(|u| u.user_id)
        .ok_or(AppError::Unauthorized)
}
#[derive(serde::Deserialize)]
pub struct PageantPath {
    pub pageant_id: Uuid,
}
#[derive(serde::Deserialize)]
pub struct RoundPath {
    pub pageant_id: Uuid,
    pub round_id: Uuid,
}
pub async fn pageants(
    req: HttpRequest,
    app: web::Data<TabulationApplication>,
) -> Result<HttpResponse, AppError> {
    let data = app
        .pageants(user_id(&req)?)
        .await?
        .into_iter()
        .map(AssignedPageantResponse)
        .collect::<Vec<_>>();
    Ok(HttpResponse::Ok().json(data))
}
pub async fn contestants(
    req: HttpRequest,
    app: web::Data<TabulationApplication>,
    path: web::Path<PageantPath>,
) -> Result<HttpResponse, AppError> {
    let data = app
        .contestants(user_id(&req)?, path.pageant_id)
        .await?
        .into_iter()
        .map(ContestantResponse)
        .collect::<Vec<_>>();
    Ok(HttpResponse::Ok().json(data))
}
pub async fn rounds(
    req: HttpRequest,
    app: web::Data<TabulationApplication>,
    path: web::Path<PageantPath>,
) -> Result<HttpResponse, AppError> {
    let data = app
        .rounds(user_id(&req)?, path.pageant_id)
        .await?
        .into_iter()
        .map(RoundResponse)
        .collect::<Vec<_>>();
    Ok(HttpResponse::Ok().json(data))
}
pub async fn categories(
    req: HttpRequest,
    app: web::Data<TabulationApplication>,
    path: web::Path<PageantPath>,
) -> Result<HttpResponse, AppError> {
    let data = app
        .categories(user_id(&req)?, path.pageant_id)
        .await?
        .into_iter()
        .map(CategoryResponse)
        .collect::<Vec<_>>();
    Ok(HttpResponse::Ok().json(data))
}
pub async fn criteria(
    req: HttpRequest,
    app: web::Data<TabulationApplication>,
    path: web::Path<PageantPath>,
) -> Result<HttpResponse, AppError> {
    let data = app
        .criteria(user_id(&req)?, path.pageant_id)
        .await?
        .into_iter()
        .map(CriterionResponse)
        .collect::<Vec<_>>();
    Ok(HttpResponse::Ok().json(data))
}
pub async fn advancements(
    req: HttpRequest,
    app: web::Data<TabulationApplication>,
    path: web::Path<RoundPath>,
) -> Result<HttpResponse, AppError> {
    let data = app
        .advancements(user_id(&req)?, path.pageant_id, path.round_id)
        .await?
        .into_iter()
        .map(AdvancementResponse)
        .collect::<Vec<_>>();
    Ok(HttpResponse::Ok().json(data))
}
