use actix_web::{HttpMessage, HttpRequest, HttpResponse, web};
use core_auth::domain::models::authenticated_user::AuthenticatedUser;
use core_infra::AppError;
use serde::Deserialize;
use uuid::Uuid;
use validator::Validate;

use crate::{
    application::pageant_staff::PageantStaffApplication,
    contracts::pageant_staff::{AssignPageantStaffRequest, PageantStaffResponse},
    domain::pageant_staff::PageantStaffRole,
};

#[derive(Deserialize)]
pub struct PageantStaffPath {
    organization_id: Uuid,
    pageant_id: Uuid,
}

#[derive(Deserialize)]
pub struct PageantStaffItemPath {
    organization_id: Uuid,
    pageant_id: Uuid,
    user_id: Uuid,
}

pub async fn list_judges(
    application: web::Data<PageantStaffApplication>,
    path: web::Path<PageantStaffPath>,
) -> Result<HttpResponse, AppError> {
    list_for_role(application, path.into_inner(), PageantStaffRole::Judge).await
}

pub async fn list_pageant_coordinators(
    application: web::Data<PageantStaffApplication>,
    path: web::Path<PageantStaffPath>,
) -> Result<HttpResponse, AppError> {
    list_for_role(
        application,
        path.into_inner(),
        PageantStaffRole::Coordinator,
    )
    .await
}

pub async fn assign_pageant_coordinator(
    request: HttpRequest,
    application: web::Data<PageantStaffApplication>,
    path: web::Path<PageantStaffPath>,
    body: web::Json<AssignPageantStaffRequest>,
) -> Result<HttpResponse, AppError> {
    assign_for_role(
        request,
        application,
        path.into_inner(),
        body,
        PageantStaffRole::Coordinator,
    )
    .await
}

pub async fn revoke_pageant_coordinator(
    application: web::Data<PageantStaffApplication>,
    path: web::Path<PageantStaffItemPath>,
) -> Result<HttpResponse, AppError> {
    revoke_for_role(
        application,
        path.into_inner(),
        PageantStaffRole::Coordinator,
    )
    .await
}

pub async fn activate_pageant_coordinator(
    application: web::Data<PageantStaffApplication>,
    path: web::Path<PageantStaffItemPath>,
) -> Result<HttpResponse, AppError> {
    activate_for_role(
        application,
        path.into_inner(),
        PageantStaffRole::Coordinator,
    )
    .await
}

pub async fn delete_pageant_coordinator_assignment(
    application: web::Data<PageantStaffApplication>,
    path: web::Path<PageantStaffItemPath>,
) -> Result<HttpResponse, AppError> {
    delete_for_role(
        application,
        path.into_inner(),
        PageantStaffRole::Coordinator,
    )
    .await
}

pub async fn assign_judge(
    request: HttpRequest,
    application: web::Data<PageantStaffApplication>,
    path: web::Path<PageantStaffPath>,
    body: web::Json<AssignPageantStaffRequest>,
) -> Result<HttpResponse, AppError> {
    assign_for_role(
        request,
        application,
        path.into_inner(),
        body,
        PageantStaffRole::Judge,
    )
    .await
}

pub async fn revoke_judge(
    application: web::Data<PageantStaffApplication>,
    path: web::Path<PageantStaffItemPath>,
) -> Result<HttpResponse, AppError> {
    revoke_for_role(application, path.into_inner(), PageantStaffRole::Judge).await
}

pub async fn activate_judge(
    application: web::Data<PageantStaffApplication>,
    path: web::Path<PageantStaffItemPath>,
) -> Result<HttpResponse, AppError> {
    activate_for_role(application, path.into_inner(), PageantStaffRole::Judge).await
}

pub async fn delete_judge_assignment(
    application: web::Data<PageantStaffApplication>,
    path: web::Path<PageantStaffItemPath>,
) -> Result<HttpResponse, AppError> {
    delete_for_role(application, path.into_inner(), PageantStaffRole::Judge).await
}

pub async fn list_tabulator(
    application: web::Data<PageantStaffApplication>,
    path: web::Path<PageantStaffPath>,
) -> Result<HttpResponse, AppError> {
    list_for_role(application, path.into_inner(), PageantStaffRole::Tabulator).await
}

pub async fn assign_tabulator(
    request: HttpRequest,
    application: web::Data<PageantStaffApplication>,
    path: web::Path<PageantStaffPath>,
    body: web::Json<AssignPageantStaffRequest>,
) -> Result<HttpResponse, AppError> {
    assign_for_role(
        request,
        application,
        path.into_inner(),
        body,
        PageantStaffRole::Tabulator,
    )
    .await
}

pub async fn revoke_tabulator(
    application: web::Data<PageantStaffApplication>,
    path: web::Path<PageantStaffItemPath>,
) -> Result<HttpResponse, AppError> {
    revoke_for_role(application, path.into_inner(), PageantStaffRole::Tabulator).await
}

pub async fn activate_tabulator(
    application: web::Data<PageantStaffApplication>,
    path: web::Path<PageantStaffItemPath>,
) -> Result<HttpResponse, AppError> {
    activate_for_role(application, path.into_inner(), PageantStaffRole::Tabulator).await
}

pub async fn delete_tabulator_assignment(
    application: web::Data<PageantStaffApplication>,
    path: web::Path<PageantStaffItemPath>,
) -> Result<HttpResponse, AppError> {
    delete_for_role(application, path.into_inner(), PageantStaffRole::Tabulator).await
}

async fn list_for_role(
    application: web::Data<PageantStaffApplication>,
    path: PageantStaffPath,
    role: PageantStaffRole,
) -> Result<HttpResponse, AppError> {
    let members = application
        .list(path.organization_id, path.pageant_id, role)
        .await?;
    Ok(HttpResponse::Ok().json(
        members
            .into_iter()
            .map(PageantStaffResponse::from)
            .collect::<Vec<_>>(),
    ))
}

async fn assign_for_role(
    request: HttpRequest,
    application: web::Data<PageantStaffApplication>,
    path: PageantStaffPath,
    body: web::Json<AssignPageantStaffRequest>,
    role: PageantStaffRole,
) -> Result<HttpResponse, AppError> {
    body.validate()?;
    let assigner_id = request
        .extensions()
        .get::<AuthenticatedUser>()
        .map(|user| user.user_id)
        .ok_or(AppError::Unauthorized)?;
    let member = application
        .assign(
            path.organization_id,
            path.pageant_id,
            assigner_id,
            body.into_inner(),
            role,
        )
        .await?;
    Ok(HttpResponse::Created().json(PageantStaffResponse::from(member)))
}

async fn revoke_for_role(
    application: web::Data<PageantStaffApplication>,
    path: PageantStaffItemPath,
    role: PageantStaffRole,
) -> Result<HttpResponse, AppError> {
    application
        .revoke(path.organization_id, path.pageant_id, path.user_id, role)
        .await?;
    Ok(HttpResponse::NoContent().finish())
}

async fn activate_for_role(
    application: web::Data<PageantStaffApplication>,
    path: PageantStaffItemPath,
    role: PageantStaffRole,
) -> Result<HttpResponse, AppError> {
    application
        .activate(path.organization_id, path.pageant_id, path.user_id, role)
        .await?;
    Ok(HttpResponse::NoContent().finish())
}

async fn delete_for_role(
    application: web::Data<PageantStaffApplication>,
    path: PageantStaffItemPath,
    role: PageantStaffRole,
) -> Result<HttpResponse, AppError> {
    application
        .delete_assignment(path.organization_id, path.pageant_id, path.user_id, role)
        .await?;
    Ok(HttpResponse::NoContent().finish())
}
