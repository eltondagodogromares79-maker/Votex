use actix_web::{HttpMessage, HttpRequest, HttpResponse, web};
use core_infra::AppError;
use validator::Validate;

use crate::{
    application::email_verification::EmailVerificationApplication,
    contracts::registration::VerifyEmailRequest,
    domain::models::authenticated_user::AuthenticatedUser,
};

pub async fn send_verification_code(
    request: HttpRequest,
    application: web::Data<EmailVerificationApplication>,
) -> Result<HttpResponse, AppError> {
    let user_id = request
        .extensions()
        .get::<AuthenticatedUser>()
        .map(|user| user.user_id)
        .ok_or(AppError::Unauthorized)?;
    application.send_verification_code(user_id).await?;
    Ok(HttpResponse::Ok().json(serde_json::json!({
        "message": "Verification code sent."
    })))
}

pub async fn verify_email(
    application: web::Data<EmailVerificationApplication>,
    request: web::Json<VerifyEmailRequest>,
) -> Result<HttpResponse, AppError> {
    request.validate()?;

    application.verify_email(request.into_inner()).await?;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "message": "Email verified successfully."
    })))
}
