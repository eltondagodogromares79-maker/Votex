use crate::{
    application::password_management::PasswordManagementApplication,
    contracts::change_password::ChangePasswordRequest,
    domain::models::authenticated_user::AuthenticatedUser,
};
use actix_web::{HttpMessage, HttpRequest, HttpResponse, web};
use core_infra::AppError;
use validator::Validate;

pub async fn change_password(
    request: HttpRequest,
    application: web::Data<PasswordManagementApplication>,
    body: web::Json<ChangePasswordRequest>,
) -> Result<HttpResponse, AppError> {
    body.validate()?;
    let user_id = request
        .extensions()
        .get::<AuthenticatedUser>()
        .map(|user| user.user_id)
        .ok_or(AppError::Unauthorized)?;
    application
        .change_password(user_id, &body.current_password, &body.new_password)
        .await?;
    Ok(HttpResponse::NoContent().finish())
}
