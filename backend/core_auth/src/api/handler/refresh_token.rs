use actix_web::{HttpRequest, HttpResponse, web};

use core_infra::{AppError, config::AuthConfig};

use crate::{
    api::cookies::build_refresh_token_cookie, application::refresh_token::RefreshTokenApplication,
};

pub async fn refresh_token(
    application: web::Data<RefreshTokenApplication>,
    config: web::Data<AuthConfig>,
    request: HttpRequest,
) -> Result<HttpResponse, AppError> {
    let refresh_token = request
        .cookie("refresh_token")
        .ok_or(AppError::InvalidToken)?;

    let (response, new_refresh_token) = application.refresh(refresh_token.value()).await?;

    let refresh_cookie = build_refresh_token_cookie(&new_refresh_token, &config);

    Ok(HttpResponse::Ok().cookie(refresh_cookie).json(response))
}
