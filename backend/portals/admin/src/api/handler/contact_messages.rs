use crate::application::contact_messages::ContactMessageApplication;
use actix_web::{HttpMessage, HttpRequest, HttpResponse, web};
use core_auth::domain::models::authenticated_user::AuthenticatedUser;
use core_infra::AppError;
use serde::Deserialize;
use uuid::Uuid;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SubmitContactMessage {
    subject: String,
    message: String,
}

#[derive(Deserialize)]
pub struct ContactMessageQuery {
    limit: Option<i64>,
    offset: Option<i64>,
}

fn user_id(request: &HttpRequest) -> Result<Uuid, AppError> {
    request
        .extensions()
        .get::<AuthenticatedUser>()
        .map(|user| user.user_id)
        .ok_or(AppError::Unauthorized)
}

pub async fn submit(
    request: HttpRequest,
    app: web::Data<ContactMessageApplication>,
    body: web::Json<SubmitContactMessage>,
) -> Result<HttpResponse, AppError> {
    let result = app
        .submit(user_id(&request)?, &body.subject, &body.message)
        .await?;
    Ok(HttpResponse::Created().json(result))
}

pub async fn list(
    app: web::Data<ContactMessageApplication>,
    query: web::Query<ContactMessageQuery>,
) -> Result<HttpResponse, AppError> {
    Ok(HttpResponse::Ok().json(app.list(query.limit, query.offset).await?))
}
