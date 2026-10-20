use actix_web::{HttpMessage, HttpRequest, HttpResponse, web};
use chrono::{DateTime, Utc};
use core_auth::domain::models::authenticated_user::AuthenticatedUser;
use core_infra::AppError;
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, PgPool};
use uuid::Uuid;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SubmitContactMessage {
    subject: String,
    message: String,
}

#[derive(FromRow, Serialize)]
#[serde(rename_all = "camelCase")]
struct SubmittedContactMessage {
    id: Uuid,
    status: String,
    created_at: DateTime<Utc>,
}

#[derive(FromRow, Serialize)]
#[serde(rename_all = "camelCase")]
struct ContactMessage {
    id: Uuid,
    sender_user_id: Option<Uuid>,
    sender_name: String,
    sender_email: String,
    subject: String,
    message: String,
    status: String,
    created_at: DateTime<Utc>,
}

#[derive(Deserialize)]
pub struct ContactMessageQuery {
    limit: Option<i64>,
    offset: Option<i64>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ContactMessagePage {
    items: Vec<ContactMessage>,
    limit: i64,
    offset: i64,
}

pub async fn submit(
    request: HttpRequest,
    pool: web::Data<PgPool>,
    body: web::Json<SubmitContactMessage>,
) -> Result<HttpResponse, AppError> {
    let user_id = request
        .extensions()
        .get::<AuthenticatedUser>()
        .map(|user| user.user_id)
        .ok_or(AppError::Unauthorized)?;
    let subject = body.subject.trim();
    let message = body.message.trim();
    if !(5..=200).contains(&subject.chars().count()) {
        return Err(AppError::BadRequest(
            "Subject must be between 5 and 200 characters.".into(),
        ));
    }
    if !(20..=2000).contains(&message.chars().count()) {
        return Err(AppError::BadRequest(
            "Message must be between 20 and 2,000 characters.".into(),
        ));
    }

    let saved = sqlx::query_as::<_, SubmittedContactMessage>(
        "INSERT INTO contact_messages (sender_user_id, sender_name, sender_email, subject, message) \
         SELECT id, concat_ws(' ', first_name, last_name), email, $2, $3 \
         FROM users WHERE id = $1 \
         RETURNING id, status, created_at",
    )
    .bind(user_id)
    .bind(subject)
    .bind(message)
    .fetch_optional(pool.get_ref())
    .await
    .map_err(database_error)?
    .ok_or(AppError::Unauthorized)?;

    Ok(HttpResponse::Created().json(saved))
}

pub async fn list(
    pool: web::Data<PgPool>,
    query: web::Query<ContactMessageQuery>,
) -> Result<HttpResponse, AppError> {
    let limit = query.limit.unwrap_or(30).clamp(1, 100);
    let offset = query.offset.unwrap_or(0).max(0);
    let items = sqlx::query_as::<_, ContactMessage>(
        "SELECT id, sender_user_id, sender_name, sender_email, subject, message, status, created_at \
         FROM contact_messages ORDER BY created_at DESC, id DESC LIMIT $1 OFFSET $2",
    )
    .bind(limit)
    .bind(offset)
    .fetch_all(pool.get_ref())
    .await
    .map_err(database_error)?;
    Ok(HttpResponse::Ok().json(ContactMessagePage {
        items,
        limit,
        offset,
    }))
}

fn database_error(error: sqlx::Error) -> AppError {
    AppError::Database(Box::new(error))
}
