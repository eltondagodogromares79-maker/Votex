use crate::application::public_catalog::PublicCatalogApplication;
use actix_web::{HttpResponse, web};
use core_infra::AppError;

pub async fn get(
    app: web::Data<PublicCatalogApplication>,
    slug: web::Path<String>,
) -> Result<HttpResponse, AppError> {
    let slug = slug.into_inner();
    if !matches!(
        slug.as_str(),
        "terms" | "privacy" | "refund-policy" | "cookie-policy"
    ) {
        return Err(AppError::NotFound("legal policy".into()));
    }
    let policy = app
        .legal_policy(&slug)
        .await?
        .ok_or_else(|| AppError::NotFound("legal policy".into()))?;
    Ok(HttpResponse::Ok().json(policy))
}
