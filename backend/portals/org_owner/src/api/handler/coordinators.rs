use actix_web::{HttpMessage, HttpRequest, HttpResponse, web};
use core_auth::domain::models::authenticated_user::AuthenticatedUser;
use core_infra::AppError;
use uuid::Uuid;
use validator::Validate;

use crate::{
    application::coordinators::CoordinatorApplication,
    contracts::coordinators::{
        CoordinatorRequest, CoordinatorResponse, CreateCoordinatorRequest,
        MessageResponse, UpdateCoordinatorRequest,
    },
};

#[derive(serde::Deserialize)]
pub struct CoordinatorPath {
    organization_id: Uuid,
    user_id: Uuid,
}

fn actor_id(request: &HttpRequest) -> Result<Uuid, AppError> {
    request
        .extensions()
        .get::<AuthenticatedUser>()
        .map(|user| user.user_id)
        .ok_or(AppError::Unauthorized)
}

pub async fn add_coordinator(
    request: HttpRequest,
    application: web::Data<CoordinatorApplication>,
    organization_id: web::Path<Uuid>,
    body: web::Json<CreateCoordinatorRequest>,
) -> Result<HttpResponse, AppError> {
    body.validate()?;
    let coordinator = application
        .add(
            organization_id.into_inner(),
            actor_id(&request)?,
            body.into_inner(),
        )
        .await?;
    Ok(HttpResponse::Created().json(CoordinatorResponse::from(coordinator)))
}

pub async fn list_coordinators(
    application: web::Data<CoordinatorApplication>,
    organization_id: web::Path<Uuid>,
) -> Result<HttpResponse, AppError> {
    let coordinators = application.list(organization_id.into_inner()).await?;
    let response: Vec<CoordinatorResponse> = coordinators
        .into_iter()
        .map(CoordinatorResponse::from)
        .collect();
    Ok(HttpResponse::Ok().json(response))
}

pub async fn get_coordinator(
    application: web::Data<CoordinatorApplication>,
    path: web::Path<CoordinatorPath>,
) -> Result<HttpResponse, AppError> {
    let path = path.into_inner();
    let coordinator = application.get(path.organization_id, path.user_id).await?;
    Ok(HttpResponse::Ok().json(CoordinatorResponse::from(coordinator)))
}

pub async fn replace_coordinator(
    request: HttpRequest,
    application: web::Data<CoordinatorApplication>,
    path: web::Path<CoordinatorPath>,
    body: web::Json<CoordinatorRequest>,
) -> Result<HttpResponse, AppError> {
    body.validate()?;
    let path = path.into_inner();
    let coordinator = application
        .replace(
            path.organization_id,
            path.user_id,
            actor_id(&request)?,
            body.into_inner(),
        )
        .await?;
    Ok(HttpResponse::Ok().json(CoordinatorResponse::from(coordinator)))
}

pub async fn remove_coordinator(
    application: web::Data<CoordinatorApplication>,
    path: web::Path<CoordinatorPath>,
) -> Result<HttpResponse, AppError> {
    let path = path.into_inner();
    application
        .remove(path.organization_id, path.user_id)
        .await?;
    Ok(HttpResponse::NoContent().finish())
}

pub async fn update_coordinator(
    application: web::Data<CoordinatorApplication>,
    path: web::Path<CoordinatorPath>,
    body: web::Json<UpdateCoordinatorRequest>,
) -> Result<HttpResponse, AppError> {
    body.validate()?;
    let path = path.into_inner();
    let coordinator = application
        .update(
            path.organization_id,
            path.user_id,
            body.first_name.trim(),
            body.last_name.trim(),
            body.email.trim(),
        )
        .await?;
    Ok(HttpResponse::Ok().json(CoordinatorResponse::from(coordinator)))
}

pub async fn resend_coordinator_credentials(
    application: web::Data<CoordinatorApplication>,
    path: web::Path<CoordinatorPath>,
) -> Result<HttpResponse, AppError> {
    let path = path.into_inner();
    application
        .resend_credentials(path.organization_id, path.user_id)
        .await?;
    Ok(HttpResponse::Ok().json(MessageResponse {
        message: "Credentials email sent.".to_string(),
    }))
}
