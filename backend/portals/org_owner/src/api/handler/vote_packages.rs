use actix_web::{HttpMessage, HttpRequest, HttpResponse, web};
use core_auth::domain::models::authenticated_user::AuthenticatedUser;
use core_infra::AppError;
use serde::Deserialize;
use uuid::Uuid;
use validator::Validate;

use crate::{
    application::vote_packages::VotePackageApplication,
    contracts::vote_packages::{
        CreateVotePackageRequest, UpdateVotePackageRequest, VotePackageResponse,
    },
};

#[derive(Deserialize)]
pub struct PackagePath {
    organization_id: Uuid,
    pageant_id: Uuid,
}

#[derive(Deserialize)]
pub struct PackageItemPath {
    organization_id: Uuid,
    pageant_id: Uuid,
    package_id: Uuid,
}

pub async fn list(
    application: web::Data<VotePackageApplication>,
    path: web::Path<PackagePath>,
) -> Result<HttpResponse, AppError> {
    let path = path.into_inner();
    let packages = application
        .list(path.organization_id, path.pageant_id)
        .await?;
    Ok(HttpResponse::Ok().json(
        packages
            .into_iter()
            .map(VotePackageResponse::from)
            .collect::<Vec<_>>(),
    ))
}

pub async fn create(
    request: HttpRequest,
    application: web::Data<VotePackageApplication>,
    path: web::Path<PackagePath>,
    body: web::Json<CreateVotePackageRequest>,
) -> Result<HttpResponse, AppError> {
    body.validate()?;
    let creator_id = request
        .extensions()
        .get::<AuthenticatedUser>()
        .map(|user| user.user_id)
        .ok_or(AppError::Unauthorized)?;
    let path = path.into_inner();
    let package = application
        .create(
            path.organization_id,
            path.pageant_id,
            creator_id,
            body.into_inner(),
        )
        .await?;
    Ok(HttpResponse::Created().json(VotePackageResponse::from(package)))
}

pub async fn update(
    application: web::Data<VotePackageApplication>,
    path: web::Path<PackageItemPath>,
    body: web::Json<UpdateVotePackageRequest>,
) -> Result<HttpResponse, AppError> {
    body.validate()?;
    let path = path.into_inner();
    let package = application
        .update(
            path.organization_id,
            path.pageant_id,
            path.package_id,
            body.into_inner(),
        )
        .await?;
    Ok(HttpResponse::Ok().json(VotePackageResponse::from(package)))
}

pub async fn deactivate(
    application: web::Data<VotePackageApplication>,
    path: web::Path<PackageItemPath>,
) -> Result<HttpResponse, AppError> {
    let path = path.into_inner();
    application
        .deactivate(path.organization_id, path.pageant_id, path.package_id)
        .await?;
    Ok(HttpResponse::NoContent().finish())
}
