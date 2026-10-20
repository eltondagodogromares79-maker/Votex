use crate::{
    application::subscriptions::SubscriptionApplication,
    contracts::subscriptions::{
        CancelAdminSubscriptionRequest, ReviewPaymentProofRequest, RevokePaymentApprovalRequest,
        SubmitPaymentProofRequest, SubscribeRequest,
    },
};
use actix_web::{HttpMessage, HttpRequest, HttpResponse, web};
use core_auth::domain::models::authenticated_user::AuthenticatedUser;
use core_infra::AppError;
use uuid::Uuid;

pub async fn plans(app: web::Data<SubscriptionApplication>) -> Result<HttpResponse, AppError> {
    Ok(HttpResponse::Ok().json(app.list_plans().await?))
}
pub async fn payment_mode(
    app: web::Data<SubscriptionApplication>,
) -> Result<HttpResponse, AppError> {
    #[derive(serde::Serialize)]
    struct PaymentModeResponse {
        mode: &'static str,
    }

    Ok(HttpResponse::Ok().json(PaymentModeResponse {
        mode: app.payment_mode(),
    }))
}
pub async fn current(
    app: web::Data<SubscriptionApplication>,
    org: web::Path<Uuid>,
) -> Result<HttpResponse, AppError> {
    Ok(HttpResponse::Ok().json(app.current(org.into_inner()).await?))
}
pub async fn usage(
    app: web::Data<SubscriptionApplication>,
    org: web::Path<Uuid>,
) -> Result<HttpResponse, AppError> {
    Ok(HttpResponse::Ok().json(app.usage(org.into_inner()).await?))
}
pub async fn history(
    app: web::Data<SubscriptionApplication>,
    org: web::Path<Uuid>,
) -> Result<HttpResponse, AppError> {
    Ok(HttpResponse::Ok().json(app.history(org.into_inner()).await?))
}
pub async fn organization_payment_proof_history(
    app: web::Data<SubscriptionApplication>,
    org: web::Path<Uuid>,
) -> Result<HttpResponse, AppError> {
    Ok(HttpResponse::Ok().json(
        app.list_organization_payment_proof_history(org.into_inner())
            .await?,
    ))
}
pub async fn pending_payment(
    app: web::Data<SubscriptionApplication>,
    org: web::Path<Uuid>,
) -> Result<HttpResponse, AppError> {
    Ok(HttpResponse::Ok().json(app.pending_payment(org.into_inner()).await?))
}

#[derive(serde::Deserialize)]
pub struct PaymentProofPath {
    organization_id: Uuid,
    subscription_id: Uuid,
}

pub async fn submit_payment_proof(
    app: web::Data<SubscriptionApplication>,
    path: web::Path<PaymentProofPath>,
    body: web::Json<SubmitPaymentProofRequest>,
) -> Result<HttpResponse, AppError> {
    use validator::Validate;
    body.validate()?;
    let path = path.into_inner();
    let result = app
        .submit_payment_proof(
            path.organization_id,
            path.subscription_id,
            body.into_inner(),
        )
        .await?;
    Ok(HttpResponse::Created().json(result))
}

pub async fn list_pending_payment_proofs(
    app: web::Data<SubscriptionApplication>,
) -> Result<HttpResponse, AppError> {
    Ok(HttpResponse::Ok().json(app.list_pending_payment_proofs().await?))
}

pub async fn list_payment_proof_history(
    app: web::Data<SubscriptionApplication>,
) -> Result<HttpResponse, AppError> {
    Ok(HttpResponse::Ok().json(app.list_payment_proof_history().await?))
}

#[derive(serde::Deserialize)]
pub struct AdminOrganizationPath {
    organization_id: Uuid,
}

pub async fn admin_subscription_details(
    app: web::Data<SubscriptionApplication>,
    path: web::Path<AdminOrganizationPath>,
) -> Result<HttpResponse, AppError> {
    Ok(HttpResponse::Ok().json(
        app.admin_subscription_details(path.into_inner().organization_id)
            .await?,
    ))
}

#[derive(serde::Deserialize)]
pub struct AdminSubscriptionPath {
    subscription_id: Uuid,
}

pub async fn admin_cancel_subscription(
    request: HttpRequest,
    app: web::Data<SubscriptionApplication>,
    path: web::Path<AdminSubscriptionPath>,
    body: web::Json<CancelAdminSubscriptionRequest>,
) -> Result<HttpResponse, AppError> {
    use validator::Validate;
    body.validate()?;
    let admin_id = request
        .extensions()
        .get::<AuthenticatedUser>()
        .map(|user| user.user_id)
        .ok_or(AppError::Unauthorized)?;
    app.admin_cancel_subscription(
        path.into_inner().subscription_id,
        admin_id,
        body.reason.clone(),
    )
    .await?;
    Ok(HttpResponse::NoContent().finish())
}

#[derive(serde::Deserialize)]
pub struct ReviewProofPath {
    proof_id: Uuid,
}

pub async fn review_payment_proof(
    request: HttpRequest,
    app: web::Data<SubscriptionApplication>,
    path: web::Path<ReviewProofPath>,
    body: web::Json<ReviewPaymentProofRequest>,
) -> Result<HttpResponse, AppError> {
    use validator::Validate;
    body.validate()?;
    let admin_id = request
        .extensions()
        .get::<AuthenticatedUser>()
        .map(|user| user.user_id)
        .ok_or(AppError::Unauthorized)?;
    let result = app
        .review_payment_proof(
            path.into_inner().proof_id,
            admin_id,
            body.approved,
            body.note.clone(),
        )
        .await?;
    Ok(HttpResponse::Ok().json(result))
}

pub async fn revoke_payment_approval(
    request: HttpRequest,
    app: web::Data<SubscriptionApplication>,
    path: web::Path<ReviewProofPath>,
    body: web::Json<RevokePaymentApprovalRequest>,
) -> Result<HttpResponse, AppError> {
    use validator::Validate;
    body.validate()?;
    let admin_id = request
        .extensions()
        .get::<AuthenticatedUser>()
        .map(|user| user.user_id)
        .ok_or(AppError::Unauthorized)?;
    let proof = app
        .revoke_payment_approval(path.into_inner().proof_id, admin_id, body.reason.clone())
        .await?;
    Ok(HttpResponse::Ok().json(proof))
}
pub async fn subscribe(
    request: HttpRequest,
    app: web::Data<SubscriptionApplication>,
    org: web::Path<Uuid>,
    body: web::Json<SubscribeRequest>,
) -> Result<HttpResponse, AppError> {
    use validator::Validate;
    body.validate()?;
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
        app.subscribe(user_id, org.into_inner(), body.into_inner(), key)
            .await?,
    ))
}
#[derive(serde::Deserialize)]
pub struct SubscriptionPath {
    organization_id: Uuid,
    subscription_id: Uuid,
}
#[derive(serde::Deserialize)]
pub struct CheckoutPath {
    organization_id: Uuid,
    subscription_id: Uuid,
}
pub async fn create_subscription_checkout(
    app: web::Data<SubscriptionApplication>,
    path: web::Path<CheckoutPath>,
) -> Result<HttpResponse, AppError> {
    let path = path.into_inner();
    Ok(HttpResponse::Ok().json(
        app.create_pending_checkout(path.organization_id, path.subscription_id)
            .await?,
    ))
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
