use actix_web::{HttpMessage, HttpRequest, HttpResponse, web};
use core_auth::domain::models::authenticated_user::AuthenticatedUser;
use core_infra::AppError;
use uuid::Uuid;
use validator::Validate;

use crate::{
    application::pageants::CoordinatorPageantApplication,
    contracts::pageants::{AssignedPageantResponse, UpdateAssignedPageantRequest},
};

fn authenticated_user_id(request: &HttpRequest) -> Result<Uuid, AppError> {
    request
        .extensions()
        .get::<AuthenticatedUser>()
        .map(|user| user.user_id)
        .ok_or(AppError::Unauthorized)
}

#[derive(serde::Deserialize)]
pub struct PageantPath {
    pageant_id: Uuid,
}

pub async fn list_assigned(
    request: HttpRequest,
    application: web::Data<CoordinatorPageantApplication>,
) -> Result<HttpResponse, AppError> {
    let pageants = application
        .list_assigned(authenticated_user_id(&request)?)
        .await?;
    let response: Vec<AssignedPageantResponse> = pageants
        .into_iter()
        .map(AssignedPageantResponse::from)
        .collect();
    Ok(HttpResponse::Ok().json(response))
}

pub async fn get_assigned(
    request: HttpRequest,
    application: web::Data<CoordinatorPageantApplication>,
    path: web::Path<PageantPath>,
) -> Result<HttpResponse, AppError> {
    let pageant = application
        .get_assigned(authenticated_user_id(&request)?, path.pageant_id)
        .await?;
    Ok(HttpResponse::Ok().json(AssignedPageantResponse::from(pageant)))
}

pub async fn update_assigned(
    request: HttpRequest,
    application: web::Data<CoordinatorPageantApplication>,
    path: web::Path<PageantPath>,
    body: web::Json<UpdateAssignedPageantRequest>,
) -> Result<HttpResponse, AppError> {
    body.validate()?;
    let pageant = application
        .update_assigned(
            authenticated_user_id(&request)?,
            path.pageant_id,
            body.into_inner(),
        )
        .await?;
    Ok(HttpResponse::Ok().json(AssignedPageantResponse::from(pageant)))
}
