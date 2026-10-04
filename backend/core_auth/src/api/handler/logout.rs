use actix_web::{HttpRequest, HttpResponse, web};

use core_infra::{AppError, config::AuthConfig};

use crate::{
    api::cookies::build_clear_refresh_token_cookie, application::logout::LogoutApplication,
};

pub async fn logout(
    application: web::Data<LogoutApplication>,
    config: web::Data<AuthConfig>,
    request: HttpRequest,
) -> Result<HttpResponse, AppError> {
    let refresh_token = request
        .cookie("refresh_token")
        .ok_or(AppError::InvalidToken)?;

    application.logout(refresh_token.value()).await?;

    let clear_cookie = build_clear_refresh_token_cookie(&config);

    Ok(HttpResponse::Ok()
        .cookie(clear_cookie)
        .json(serde_json::json!({
            "message": "Logged out successfully."
        })))
}
