use crate::{
    application::transactions::TransactionHistoryApplication,
    contracts::transactions::{TransactionHistoryQuery, TransactionHistoryResponse},
};
use actix_web::{HttpResponse, web};
use core_infra::AppError;
use uuid::Uuid;

pub async fn history(
    app: web::Data<TransactionHistoryApplication>,
    organization_id: web::Path<Uuid>,
    query: web::Query<TransactionHistoryQuery>,
) -> Result<HttpResponse, AppError> {
    let query = query.into_inner();
    let (items, limit, offset) = app
        .list_for_organization(
            organization_id.into_inner(),
            query.pageant_id,
            query.candidate_id,
            query.from,
            query.to,
            query.limit,
            query.offset,
        )
        .await?;
    Ok(HttpResponse::Ok().json(TransactionHistoryResponse {
        items,
        limit,
        offset,
    }))
}
