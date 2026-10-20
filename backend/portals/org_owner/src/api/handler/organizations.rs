use actix_web::{HttpResponse, web};
use core_infra::AppError;
use uuid::Uuid;
use validator::Validate;

use crate::{
    application::organizations::OrganizationApplication,
    contracts::organization::UpdateOrganizationProfile,
};

pub async fn get_organization(
    application: web::Data<OrganizationApplication>,
    organization_id: web::Path<Uuid>,
) -> Result<HttpResponse, AppError> {
    Ok(HttpResponse::Ok().json(application.get(organization_id.into_inner()).await?))
}

pub async fn update_organization(
    application: web::Data<OrganizationApplication>,
    organization_id: web::Path<Uuid>,
    body: web::Json<UpdateOrganizationProfile>,
) -> Result<HttpResponse, AppError> {
    body.validate()?;
    Ok(HttpResponse::Ok().json(
        application
            .update(organization_id.into_inner(), body.into_inner())
            .await?,
    ))
}
