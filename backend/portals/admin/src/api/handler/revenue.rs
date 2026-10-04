use actix_web::{HttpResponse, web};
use core_infra::AppError;

use crate::{
    application::revenue::RevenueApplication,
    contracts::revenue::{RevenueQuery, RevenueReportResponse},
};

pub async fn report(
    application: web::Data<RevenueApplication>,
    query: web::Query<RevenueQuery>,
) -> Result<HttpResponse, AppError> {
    let report = application
        .report(query.organization_id, query.from, query.to)
        .await?;
    Ok(HttpResponse::Ok().json(RevenueReportResponse::from(report)))
}
