use actix_web::{HttpMessage, HttpRequest, HttpResponse, web};
use chrono::{DateTime, Utc};
use core_infra::AppError;
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, PgPool};
use uuid::Uuid;

use crate::domain::models::authenticated_user::AuthenticatedUser;

#[derive(Debug, FromRow, Serialize)]
#[serde(rename_all = "camelCase")]
struct Notification {
    id: Uuid,
    notification_type: String,
    title: String,
    message: String,
    href: Option<String>,
    read_at: Option<DateTime<Utc>>,
    created_at: DateTime<Utc>,
}

#[derive(Deserialize)]
pub struct NotificationQuery {
    limit: Option<i64>,
    offset: Option<i64>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct NotificationPage {
    items: Vec<Notification>,
    unread_count: i64,
    total: i64,
    limit: i64,
    offset: i64,
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
    pool: web::Data<PgPool>,
    query: web::Query<NotificationQuery>,
) -> Result<HttpResponse, AppError> {
    let user = user_id(&request)?;
    let limit = query.limit.unwrap_or(30).clamp(1, 100);
    let offset = query.offset.unwrap_or(0).max(0);
    let items = sqlx::query_as::<_, Notification>(
        "SELECT id, notification_type, title, message, href, read_at, created_at \
         FROM user_notifications WHERE recipient_user_id = $1 \
         ORDER BY created_at DESC, id DESC LIMIT $2 OFFSET $3",
    )
    .bind(user)
    .bind(limit)
    .bind(offset)
    .fetch_all(pool.get_ref())
    .await
    .map_err(database_error)?;
    let unread_count = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*)::bigint FROM user_notifications WHERE recipient_user_id = $1 AND read_at IS NULL",
    )
    .bind(user)
    .fetch_one(pool.get_ref())
    .await
    .map_err(database_error)?;
    let total = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*)::bigint FROM user_notifications WHERE recipient_user_id = $1",
    )
    .bind(user)
    .fetch_one(pool.get_ref())
    .await
    .map_err(database_error)?;

    Ok(HttpResponse::Ok().json(NotificationPage {
        items,
        unread_count,
        total,
        limit,
        offset,
    }))
}

pub async fn mark_read(
    request: HttpRequest,
    pool: web::Data<PgPool>,
    path: web::Path<Uuid>,
) -> Result<HttpResponse, AppError> {
    let user = user_id(&request)?;
    let result = sqlx::query(
        "UPDATE user_notifications SET read_at = COALESCE(read_at, now()) \
         WHERE id = $1 AND recipient_user_id = $2",
    )
    .bind(path.into_inner())
    .bind(user)
    .execute(pool.get_ref())
    .await
    .map_err(database_error)?;
    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("notification".into()));
    }
    Ok(HttpResponse::NoContent().finish())
}

pub async fn mark_all_read(
    request: HttpRequest,
    pool: web::Data<PgPool>,
) -> Result<HttpResponse, AppError> {
    let user = user_id(&request)?;
    sqlx::query(
        "UPDATE user_notifications SET read_at = now() \
         WHERE recipient_user_id = $1 AND read_at IS NULL",
    )
    .bind(user)
    .execute(pool.get_ref())
    .await
    .map_err(database_error)?;
    Ok(HttpResponse::NoContent().finish())
}

fn database_error(error: sqlx::Error) -> AppError {
    AppError::Database(Box::new(error))
}
