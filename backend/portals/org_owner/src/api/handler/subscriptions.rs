use crate::{
    application::subscriptions::SubscriptionApplication, contracts::subscriptions::SubscribeRequest,
};
use actix_web::{HttpMessage, HttpRequest, HttpResponse, web};
use core_auth::domain::models::authenticated_user::AuthenticatedUser;
use core_infra::AppError;
use uuid::Uuid;

pub async fn plans(app: web::Data<SubscriptionApplication>) -> Result<HttpResponse, AppError> {
    Ok(HttpResponse::Ok().json(app.list_plans().await?))
}
pub async fn current(
    app: web::Data<SubscriptionApplication>,
    org: web::Path<Uuid>,
) -> Result<HttpResponse, AppError> {
    Ok(HttpResponse::Ok().json(app.current(org.into_inner()).await?))
}
pub async fn history(
    app: web::Data<SubscriptionApplication>,
    org: web::Path<Uuid>,
) -> Result<HttpResponse, AppError> {
    Ok(HttpResponse::Ok().json(app.history(org.into_inner()).await?))
}
pub async fn subscribe(
    request: HttpRequest,
    app: web::Data<SubscriptionApplication>,
    org: web::Path<Uuid>,
    body: web::Json<SubscribeRequest>,
) -> Result<HttpResponse, AppError> {
    let user_id = request
        .extensions()
        .get::<AuthenticatedUser>()
        .map(|u| u.user_id)
        .ok_or(AppError::Unauthorized)?;
    let key = request
        .headers()
        .get("Idempotency-Key")
        .and_then(|v| v.to_str().ok())
        .ok_or_else(|| AppError::BadRequest("Idempotency-Key header is required".into()))?;
    Ok(HttpResponse::Created().json(
        app.subscribe(user_id, org.into_inner(), body.plan_id, key).await?,
    ))
}
#[derive(serde::Deserialize)]
pub struct SubscriptionPath {
    organization_id: Uuid,
    subscription_id: Uuid,
}
pub async fn cancel(
    app: web::Data<SubscriptionApplication>,
    path: web::Path<SubscriptionPath>,
) -> Result<HttpResponse, AppError> {
    let path = path.into_inner();
    app.cancel(path.organization_id, path.subscription_id)
        .await?;
    Ok(HttpResponse::NoContent().finish())
}
