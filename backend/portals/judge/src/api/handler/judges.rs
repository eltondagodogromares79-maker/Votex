use crate::{
    application::judges::JudgeApplication,
    contracts::judge::{
        AssignedPageantResponse, CategoryResponse, ContestantResponse, CriterionResponse,
        RoundResponse,
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
pub async fn pageants(
    req: HttpRequest,
    app: web::Data<JudgeApplication>,
) -> Result<HttpResponse, AppError> {
    let values = app
        .pageants(user_id(&req)?)
        .await?
        .into_iter()
        .map(AssignedPageantResponse)
        .collect::<Vec<_>>();
    Ok(HttpResponse::Ok().json(values))
}
pub async fn contestants(
    req: HttpRequest,
    app: web::Data<JudgeApplication>,
    path: web::Path<PageantPath>,
) -> Result<HttpResponse, AppError> {
    let values = app
        .contestants(user_id(&req)?, path.pageant_id)
        .await?
        .into_iter()
        .map(ContestantResponse)
        .collect::<Vec<_>>();
    Ok(HttpResponse::Ok().json(values))
}
pub async fn rounds(
    req: HttpRequest,
    app: web::Data<JudgeApplication>,
    path: web::Path<PageantPath>,
) -> Result<HttpResponse, AppError> {
    let values = app
        .rounds(user_id(&req)?, path.pageant_id)
        .await?
        .into_iter()
        .map(RoundResponse)
        .collect::<Vec<_>>();
    Ok(HttpResponse::Ok().json(values))
}
pub async fn categories(
    req: HttpRequest,
    app: web::Data<JudgeApplication>,
    path: web::Path<PageantPath>,
) -> Result<HttpResponse, AppError> {
    let values = app
        .categories(user_id(&req)?, path.pageant_id)
        .await?
        .into_iter()
        .map(CategoryResponse)
        .collect::<Vec<_>>();
    Ok(HttpResponse::Ok().json(values))
}
pub async fn criteria(
    req: HttpRequest,
    app: web::Data<JudgeApplication>,
    path: web::Path<PageantPath>,
) -> Result<HttpResponse, AppError> {
    let values = app
        .criteria(user_id(&req)?, path.pageant_id)
        .await?
        .into_iter()
        .map(CriterionResponse)
        .collect::<Vec<_>>();
    Ok(HttpResponse::Ok().json(values))
}
