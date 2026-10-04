use crate::{
    application::vote_revenue::VoteRevenueApplication,
    contracts::vote_revenue::{VoteRevenueQuery, VoteRevenueReportResponse},
};
use actix_web::{HttpResponse, web};
use core_infra::AppError;
use uuid::Uuid;

pub async fn report(
    application: web::Data<VoteRevenueApplication>,
    organization_id: web::Path<Uuid>,
    query: web::Query<VoteRevenueQuery>,
) -> Result<HttpResponse, AppError> {
    let organization_id = organization_id.into_inner();
    let query = query.into_inner();
    let report = application
        .report(
            organization_id,
            query.pageant_id,
            query.candidate_id,
            query.from,
            query.to,
        )
        .await?;
    Ok(HttpResponse::Ok().json(VoteRevenueReportResponse::from(report)))
}
