use actix_web::{HttpResponse, web};
use core_infra::AppError;
use uuid::Uuid;

use crate::{
    application::activity_logs::ActivityLogApplication,
    contracts::activity_logs::{
        AuditLogQuery, AuditLogResponse, LogPage, TransactionLogQuery, TransactionLogResponse,
    },
};

pub async fn list_audit_logs(
    application: web::Data<ActivityLogApplication>,
    query: web::Query<AuditLogQuery>,
) -> Result<HttpResponse, AppError> {
    let filter = query.into_inner().into_filter();
    let (limit, offset) = (filter.limit, filter.offset);
    let logs = application.list_audit_logs(filter).await?;
    Ok(HttpResponse::Ok().json(LogPage {
        items: logs.into_iter().map(AuditLogResponse::from).collect(),
        limit,
        offset,
    }))
}

pub async fn get_audit_log(
    application: web::Data<ActivityLogApplication>,
    id: web::Path<Uuid>,
) -> Result<HttpResponse, AppError> {
    let log = application.get_audit_log(id.into_inner()).await?;
    Ok(HttpResponse::Ok().json(AuditLogResponse::from(log)))
}

pub async fn list_transaction_logs(
    application: web::Data<ActivityLogApplication>,
    query: web::Query<TransactionLogQuery>,
) -> Result<HttpResponse, AppError> {
    let filter = query.into_inner().into_filter();
    let (limit, offset) = (filter.limit, filter.offset);
    let logs = application.list_transaction_logs(filter).await?;
    Ok(HttpResponse::Ok().json(LogPage {
        items: logs.into_iter().map(TransactionLogResponse::from).collect(),
        limit,
        offset,
    }))
}

pub async fn get_transaction_log(
    application: web::Data<ActivityLogApplication>,
    id: web::Path<Uuid>,
) -> Result<HttpResponse, AppError> {
    let log = application.get_transaction_log(id.into_inner()).await?;
    Ok(HttpResponse::Ok().json(TransactionLogResponse::from(log)))
}
