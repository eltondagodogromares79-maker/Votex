use crate::application::public_catalog::PublicCatalogApplication;
use actix_web::{HttpResponse, web};
use core_infra::AppError;

pub async fn pageants(
    application: web::Data<PublicCatalogApplication>,
) -> Result<HttpResponse, AppError> {
    Ok(HttpResponse::Ok().json(application.pageants().await?))
}

pub async fn pageant(
    application: web::Data<PublicCatalogApplication>,
    path: web::Path<String>,
) -> Result<HttpResponse, AppError> {
    application
        .pageant(&path.into_inner())
        .await?
        .map(|details| HttpResponse::Ok().json(details))
        .ok_or_else(|| AppError::NotFound("public pageant".into()))
}

pub async fn plans(
    application: web::Data<PublicCatalogApplication>,
) -> Result<HttpResponse, AppError> {
    Ok(HttpResponse::Ok().json(application.plans().await?))
}
