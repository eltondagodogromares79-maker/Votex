use crate::{
    application::transactions::TransactionHistoryApplication,
    contracts::transactions::{TransactionHistoryQuery, TransactionHistoryResponse},
};
use actix_web::{HttpMessage, HttpRequest, HttpResponse, web};
use core_auth::domain::models::authenticated_user::AuthenticatedUser;
use core_infra::AppError;

pub async fn history(
    request: HttpRequest,
    app: web::Data<TransactionHistoryApplication>,
    query: web::Query<TransactionHistoryQuery>,
) -> Result<HttpResponse, AppError> {
    let user_id = request
        .extensions()
        .get::<AuthenticatedUser>()
        .map(|user| user.user_id)
        .ok_or(AppError::Unauthorized)?;
    let (items, limit, offset) = app
        .list_for_user(user_id, query.limit, query.offset)
        .await?;
    Ok(HttpResponse::Ok().json(TransactionHistoryResponse {
        items,
        limit,
        offset,
    }))
}
