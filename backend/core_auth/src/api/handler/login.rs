use actix_web::{HttpResponse, web};
use core_infra::{AppError, config::AuthConfig};
use validator::Validate;

use crate::{
    api::cookies::build_refresh_token_cookie,
    application::login::AuthenticationApplication,
    contracts::login::{LoginRequest, LoginResponse},
};

pub async fn login(
    application: web::Data<AuthenticationApplication>,
    config: web::Data<AuthConfig>,
    request: web::Json<LoginRequest>,
) -> Result<HttpResponse, AppError> {
    request.validate()?;

    let result = application
        .login(request.into_inner(), None, None)
        .await?;

    // Refresh token goes into an HttpOnly cookie — never in the JSON body.
    let refresh_cookie = build_refresh_token_cookie(&result.refresh_token, &config);

    let response = LoginResponse {
        access_token: result.access_token,
        token_type: result.token_type,
        expires_in: result.expires_in,
    };

    Ok(HttpResponse::Ok().cookie(refresh_cookie).json(response))
}
