use actix_web::{HttpResponse, web};
use core_infra::AppError;
use validator::Validate;

use crate::{
    application::email_verification::EmailVerificationApplication,
    contracts::registration::VerifyEmailRequest,
};

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
