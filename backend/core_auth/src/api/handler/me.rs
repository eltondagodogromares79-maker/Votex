use crate::{
    application::profile::ProfileApplication,
    contracts::profile::{DeleteAccountRequest, RequestEmailChange, UpdateProfileRequest},
    domain::models::authenticated_user::AuthenticatedUser,
};
use actix_web::{HttpMessage, HttpRequest, HttpResponse, web};
use core_infra::{AppError, config::AuthConfig};

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

pub async fn request_email_change(
    request: HttpRequest,
    application: web::Data<ProfileApplication>,
    body: web::Json<RequestEmailChange>,
) -> Result<HttpResponse, AppError> {
    use validator::Validate;
    body.validate()?;
    let auth = request
        .extensions()
        .get::<AuthenticatedUser>()
        .cloned()
        .ok_or(AppError::Unauthorized)?;
    let profile = application
        .request_email_change(auth.user_id, &auth.role, body.into_inner())
        .await?;
    Ok(HttpResponse::Ok().json(profile))
}

/// DELETE /api/v1/auth/me — deactivates and anonymizes only the authenticated account.
pub async fn delete_me(
    request: HttpRequest,
    application: web::Data<ProfileApplication>,
    config: web::Data<AuthConfig>,
    body: web::Json<DeleteAccountRequest>,
) -> Result<HttpResponse, AppError> {
    use validator::Validate;
    body.validate()?;
    let user_id = request
        .extensions()
        .get::<AuthenticatedUser>()
        .map(|user| user.user_id)
        .ok_or(AppError::Unauthorized)?;
    application
        .delete_account(user_id, body.into_inner())
        .await?;
    let clear_cookie = crate::api::cookies::build_clear_refresh_token_cookie(&config);
    Ok(HttpResponse::NoContent().cookie(clear_cookie).finish())
}
