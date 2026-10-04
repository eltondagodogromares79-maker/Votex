use actix_web::{HttpResponse, web};
use core_infra::AppError;
use uuid::Uuid;

use crate::{
    application::admin_directory::AdminDirectoryApplication,
    contracts::directory::{
        AdminOrganizationResponse, AdminPageantResponse, AdminUserResponse, DirectoryPage, DirectoryQuery,
    },
};

pub async fn list_users(
    application: web::Data<AdminDirectoryApplication>,
    query: web::Query<DirectoryQuery>,
) -> Result<HttpResponse, AppError> {
    let (limit, offset) = query.bounded_values();
    let users = application.list_users(limit, offset).await?;
    Ok(HttpResponse::Ok().json(DirectoryPage {
        items: users.into_iter().map(AdminUserResponse::from).collect(),
        limit,
        offset,
    }))
}

pub async fn get_user(
    application: web::Data<AdminDirectoryApplication>,
    id: web::Path<Uuid>,
) -> Result<HttpResponse, AppError> {
    let user = application.get_user(id.into_inner()).await?;
    Ok(HttpResponse::Ok().json(AdminUserResponse::from(user)))
}

pub async fn list_organizations(
    application: web::Data<AdminDirectoryApplication>,
    query: web::Query<DirectoryQuery>,
) -> Result<HttpResponse, AppError> {
    let (limit, offset) = query.bounded_values();
    let organizations = application.list_organizations(limit, offset).await?;
    Ok(HttpResponse::Ok().json(DirectoryPage {
        items: organizations
            .into_iter()
            .map(AdminOrganizationResponse::from)
            .collect(),
        limit,
        offset,
    }))
}

pub async fn get_organization(
    application: web::Data<AdminDirectoryApplication>,
    id: web::Path<Uuid>,
) -> Result<HttpResponse, AppError> {
    let organization = application.get_organization(id.into_inner()).await?;
    Ok(HttpResponse::Ok().json(AdminOrganizationResponse::from(organization)))
}

pub async fn list_pageants(
    application: web::Data<AdminDirectoryApplication>,
    query: web::Query<DirectoryQuery>,
) -> Result<HttpResponse, AppError> {
    let (limit, offset) = query.bounded_values();
    let pageants = application.list_pageants(limit, offset).await?;
    Ok(HttpResponse::Ok().json(DirectoryPage {
        items: pageants.into_iter().map(AdminPageantResponse::from).collect(),
        limit,
        offset,
    }))
}

pub async fn get_pageant(
    application: web::Data<AdminDirectoryApplication>,
    id: web::Path<Uuid>,
) -> Result<HttpResponse, AppError> {
    let pageant = application.get_pageant(id.into_inner()).await?;
    Ok(HttpResponse::Ok().json(AdminPageantResponse::from(pageant)))
}
