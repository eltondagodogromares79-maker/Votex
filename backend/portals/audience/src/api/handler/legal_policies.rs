use actix_web::{HttpResponse, web};
use chrono::{DateTime, Utc};
use core_infra::AppError;
use serde::Serialize;
use sqlx::{FromRow, PgPool};

#[derive(FromRow, Serialize)]
#[serde(rename_all = "camelCase")]
struct LegalPolicy {
    slug: String,
    title: String,
    intro: String,
    body: String,
    version: i32,
    updated_at: DateTime<Utc>,
}

pub async fn get(
    pool: web::Data<PgPool>,
    slug: web::Path<String>,
) -> Result<HttpResponse, AppError> {
    let slug = slug.into_inner();
    if !matches!(slug.as_str(), "terms" | "privacy" | "refund-policy" | "cookie-policy") {
        return Err(AppError::NotFound("legal policy".into()));
    }
    let policy = sqlx::query_as::<_, LegalPolicy>(
        "SELECT slug, title, intro, body, version, updated_at FROM legal_policies WHERE slug = $1",
    )
    .bind(slug)
    .fetch_optional(pool.get_ref())
    .await
    .map_err(|error| AppError::Database(Box::new(error)))?
    .ok_or_else(|| AppError::NotFound("legal policy".into()))?;
    Ok(HttpResponse::Ok().json(policy))
}
