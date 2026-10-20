use actix_web::{HttpMessage, HttpRequest, HttpResponse, web};
use core_auth::domain::models::authenticated_user::AuthenticatedUser;
use core_infra::AppError;
use serde::Deserialize;
use uuid::Uuid;
use validator::Validate;

use crate::{
    application::judges::CoordinatorJudgeApplication,
    contracts::judges::{AssignJudgeRequest, PageantJudgeResponse},
    domain::judge::PageantStaffRole,
};

#[derive(Deserialize)]
pub struct PageantPath {
    pageant_id: Uuid,
}

#[derive(Deserialize)]
pub struct JudgePath {
    pageant_id: Uuid,
    user_id: Uuid,
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
    application: web::Data<CoordinatorJudgeApplication>,
    path: web::Path<PageantPath>,
) -> Result<HttpResponse, AppError> {
    let judges = application
        .list(
            actor_id(&request)?,
            path.pageant_id,
            PageantStaffRole::Judge,
        )
        .await?;
    Ok(HttpResponse::Ok().json(
        judges
            .into_iter()
            .map(PageantJudgeResponse::from)
            .collect::<Vec<_>>(),
    ))
}

pub async fn assign(
    request: HttpRequest,
    application: web::Data<CoordinatorJudgeApplication>,
    path: web::Path<PageantPath>,
    body: web::Json<AssignJudgeRequest>,
) -> Result<HttpResponse, AppError> {
    body.validate()?;
    let judge = application
        .assign(
            actor_id(&request)?,
            path.pageant_id,
            body.into_inner(),
            PageantStaffRole::Judge,
        )
        .await?;
    Ok(HttpResponse::Created().json(PageantJudgeResponse::from(judge)))
}

pub async fn revoke(
    request: HttpRequest,
    application: web::Data<CoordinatorJudgeApplication>,
    path: web::Path<JudgePath>,
) -> Result<HttpResponse, AppError> {
    application
        .revoke(
            actor_id(&request)?,
            path.pageant_id,
            path.user_id,
            PageantStaffRole::Judge,
        )
        .await?;
    Ok(HttpResponse::NoContent().finish())
}

pub async fn activate(
    request: HttpRequest,
    application: web::Data<CoordinatorJudgeApplication>,
    path: web::Path<JudgePath>,
) -> Result<HttpResponse, AppError> {
    application
        .activate(
            actor_id(&request)?,
            path.pageant_id,
            path.user_id,
            PageantStaffRole::Judge,
        )
        .await?;
    Ok(HttpResponse::NoContent().finish())
}

pub async fn delete_assignment(
    request: HttpRequest,
    application: web::Data<CoordinatorJudgeApplication>,
    path: web::Path<JudgePath>,
) -> Result<HttpResponse, AppError> {
    application
        .delete_assignment(
            actor_id(&request)?,
            path.pageant_id,
            path.user_id,
            PageantStaffRole::Judge,
        )
        .await?;
    Ok(HttpResponse::NoContent().finish())
}

pub async fn list_tabulators(
    request: HttpRequest,
    application: web::Data<CoordinatorJudgeApplication>,
    path: web::Path<PageantPath>,
) -> Result<HttpResponse, AppError> {
    let members = application
        .list(
            actor_id(&request)?,
            path.pageant_id,
            PageantStaffRole::Tabulator,
        )
        .await?;
    Ok(HttpResponse::Ok().json(
        members
            .into_iter()
            .map(PageantJudgeResponse::from)
            .collect::<Vec<_>>(),
    ))
}

pub async fn assign_tabulators(
    request: HttpRequest,
    application: web::Data<CoordinatorJudgeApplication>,
    path: web::Path<PageantPath>,
    body: web::Json<AssignJudgeRequest>,
) -> Result<HttpResponse, AppError> {
    body.validate()?;
    let member = application
        .assign(
            actor_id(&request)?,
            path.pageant_id,
            body.into_inner(),
            PageantStaffRole::Tabulator,
        )
        .await?;
    Ok(HttpResponse::Created().json(PageantJudgeResponse::from(member)))
}

pub async fn revoke_tabulators(
    request: HttpRequest,
    application: web::Data<CoordinatorJudgeApplication>,
    path: web::Path<JudgePath>,
) -> Result<HttpResponse, AppError> {
    application
        .revoke(
            actor_id(&request)?,
            path.pageant_id,
            path.user_id,
            PageantStaffRole::Tabulator,
        )
        .await?;
    Ok(HttpResponse::NoContent().finish())
}

pub async fn activate_tabulator(
    request: HttpRequest,
    application: web::Data<CoordinatorJudgeApplication>,
    path: web::Path<JudgePath>,
) -> Result<HttpResponse, AppError> {
    application
        .activate(
            actor_id(&request)?,
            path.pageant_id,
            path.user_id,
            PageantStaffRole::Tabulator,
        )
        .await?;
    Ok(HttpResponse::NoContent().finish())
}

pub async fn delete_tabulator_assignment(
    request: HttpRequest,
    application: web::Data<CoordinatorJudgeApplication>,
    path: web::Path<JudgePath>,
) -> Result<HttpResponse, AppError> {
    application
        .delete_assignment(
            actor_id(&request)?,
            path.pageant_id,
            path.user_id,
            PageantStaffRole::Tabulator,
        )
        .await?;
    Ok(HttpResponse::NoContent().finish())
}
