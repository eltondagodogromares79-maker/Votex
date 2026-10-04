use actix_web::{HttpResponse, web};
use core_infra::AppError;
use validator::Validate;

use crate::{
    application::registration::RegistrationApplication,
    contracts::registration::{RegisterAudienceRequest, RegisterOrgOwnerRequest},
};

pub async fn register_audience(
    application: web::Data<RegistrationApplication>,
    request: web::Json<RegisterAudienceRequest>,
) -> Result<HttpResponse, AppError> {
    request.validate()?;

    let result = application.register_audience(request.into_inner()).await?;

    Ok(HttpResponse::Created().json(result))
}

pub async fn register_organization_owner(
    application: web::Data<RegistrationApplication>,
    request: web::Json<RegisterOrgOwnerRequest>,
) -> Result<HttpResponse, AppError> {
    request.validate()?;

    let result = application.register_org_owner(request.into_inner()).await?;

    Ok(HttpResponse::Created().json(result))
}
