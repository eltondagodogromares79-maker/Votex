use crate::{
    application::profile::ProfileApplication,
    contracts::profile::UpdateProfileRequest,
    domain::models::authenticated_user::AuthenticatedUser,
};
use actix_web::{HttpMessage, HttpRequest, HttpResponse, web};
use core_infra::AppError;

/// GET /api/v1/auth/me
///
/// Reads the authenticated user's identity from the validated JWT
/// (user_id from `sub`, role from `rol`) — never from query params or body.
pub async fn me(
    request: HttpRequest,
    application: web::Data<ProfileApplication>,
) -> Result<HttpResponse, AppError> {
    let auth = request
        .extensions()
        .get::<AuthenticatedUser>()
        .cloned()
        .ok_or(AppError::Unauthorized)?;

    let profile = application.get(auth.user_id, &auth.role).await?;

    Ok(HttpResponse::Ok().json(profile))
}

/// PUT /api/v1/auth/me
///
/// Updates mutable profile fields. Role is not modified by this endpoint.
pub async fn update_me(
    request: HttpRequest,
    application: web::Data<ProfileApplication>,
    body: web::Json<UpdateProfileRequest>,
) -> Result<HttpResponse, AppError> {
    use validator::Validate;
    body.validate()?;

    let auth = request
        .extensions()
        .get::<AuthenticatedUser>()
        .cloned()
        .ok_or(AppError::Unauthorized)?;

    let profile = application
        .update(auth.user_id, &auth.role, body.into_inner())
        .await?;

    Ok(HttpResponse::Ok().json(profile))
}
