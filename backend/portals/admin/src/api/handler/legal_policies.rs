use actix_web::{HttpMessage, HttpRequest, HttpResponse, web};
use chrono::{DateTime, Utc};
use core_auth::domain::models::authenticated_user::AuthenticatedUser;
use core_infra::AppError;
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, PgPool};
use uuid::Uuid;

#[derive(FromRow, Serialize)]
#[serde(rename_all = "camelCase")]
struct LegalPolicy {
    id: Uuid,
    slug: String,
    title: String,
    intro: String,
    body: String,
    version: i32,
    updated_at: DateTime<Utc>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateLegalPolicy {
    title: String,
    intro: String,
    body: String,
}

pub async fn list(pool: web::Data<PgPool>) -> Result<HttpResponse, AppError> {
    let policies = sqlx::query_as::<_, LegalPolicy>(
        "SELECT id, slug, title, intro, body, version, updated_at FROM legal_policies ORDER BY slug",
    )
    .fetch_all(pool.get_ref())
    .await
    .map_err(database_error)?;
    Ok(HttpResponse::Ok().json(policies))
}

pub async fn update(
    request: HttpRequest,
    pool: web::Data<PgPool>,
    slug: web::Path<String>,
    body: web::Json<UpdateLegalPolicy>,
) -> Result<HttpResponse, AppError> {
    let user_id = request
        .extensions()
        .get::<AuthenticatedUser>()
        .map(|user| user.user_id)
        .ok_or(AppError::Unauthorized)?;
    let slug = slug.into_inner();
    if !matches!(slug.as_str(), "terms" | "privacy" | "refund-policy" | "cookie-policy") {
        return Err(AppError::NotFound("legal policy".into()));
    }
    let title = body.title.trim();
    let intro = body.intro.trim();
    let content = body.body.trim();
    if title.is_empty() || title.chars().count() > 160 {
        return Err(AppError::BadRequest("Title must be between 1 and 160 characters.".into()));
    }
    if intro.chars().count() > 2000 {
        return Err(AppError::BadRequest("Introduction cannot exceed 2,000 characters.".into()));
    }
    if content.is_empty() || content.chars().count() > 100_000 {
        return Err(AppError::BadRequest("Policy content must be between 1 and 100,000 characters.".into()));
    }

    let policy = sqlx::query_as::<_, LegalPolicy>(
        "UPDATE legal_policies SET title = $2, intro = $3, body = $4, version = version + 1, updated_by = $5, updated_at = NOW() WHERE slug = $1 RETURNING id, slug, title, intro, body, version, updated_at",
    )
    .bind(slug)
    .bind(title)
    .bind(intro)
    .bind(content)
    .bind(user_id)
    .fetch_optional(pool.get_ref())
    .await
    .map_err(database_error)?
    .ok_or_else(|| AppError::NotFound("legal policy".into()))?;

    Ok(HttpResponse::Ok().json(policy))
}

fn database_error(error: sqlx::Error) -> AppError {
    AppError::Database(Box::new(error))
}
