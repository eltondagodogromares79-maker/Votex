use actix_web::{HttpResponse, web};
use admin::{
    application::activity_logs::ActivityLogApplication,
    contracts::activity_logs::{AuditLogQuery, AuditLogResponse, LogPage},
};
use core_infra::AppError;
use uuid::Uuid;

pub async fn list_activity_logs(
    application: web::Data<ActivityLogApplication>,
    organization_id: web::Path<Uuid>,
    query: web::Query<AuditLogQuery>,
) -> Result<HttpResponse, AppError> {
    let mut filter = query.into_inner().into_filter();
    filter.organization_id = Some(organization_id.into_inner());
    let (limit, offset) = (filter.limit, filter.offset);
    let logs = application.list_audit_logs(filter).await?;
    Ok(HttpResponse::Ok().json(LogPage {
        items: logs.into_iter().map(AuditLogResponse::from).collect(),
        limit,
        offset,
    }))
}
