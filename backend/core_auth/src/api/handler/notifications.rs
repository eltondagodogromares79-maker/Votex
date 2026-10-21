use actix_web::{HttpMessage, HttpRequest, HttpResponse, web};
use core_infra::AppError;
use serde::Deserialize;
use uuid::Uuid;

use crate::{
    application::notifications::NotificationApplication,
    domain::models::authenticated_user::AuthenticatedUser,
};

#[derive(Deserialize)]
pub struct NotificationQuery {
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

pub async fn list(
    request: HttpRequest,
    app: web::Data<NotificationApplication>,
    query: web::Query<NotificationQuery>,
) -> Result<HttpResponse, AppError> {
    let page = app
        .list(user_id(&request)?, query.limit, query.offset)
        .await?;
    Ok(HttpResponse::Ok().json(page))
}

pub async fn mark_read(
    request: HttpRequest,
    app: web::Data<NotificationApplication>,
    path: web::Path<Uuid>,
) -> Result<HttpResponse, AppError> {
    app.mark_read(user_id(&request)?, path.into_inner()).await?;
    Ok(HttpResponse::NoContent().finish())
}

pub async fn mark_all_read(
    request: HttpRequest,
    app: web::Data<NotificationApplication>,
) -> Result<HttpResponse, AppError> {
    app.mark_all_read(user_id(&request)?).await?;
    Ok(HttpResponse::NoContent().finish())
}
