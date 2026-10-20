use std::sync::Arc;

use actix_web::web;

use actix_web::{HttpRequest, HttpResponse};
use audience::application::voting::VotingApplication;
use core_infra::application::ports::security::TokenAuthenticator;
use core_infra::{
    AppError, application::ports::payment_provider::PaymentProvider,
    db::with_system_database_context, domain::payments::CheckoutWebhookEvent,
};
use org_owner::application::subscriptions::SubscriptionApplication;

/// Register all application routes.
pub fn routes(config: &mut web::ServiceConfig, token_validator: Arc<dyn TokenAuthenticator>) {
    core_auth::api::routes::auth::configure(config, token_validator);
}

async fn paymongo_webhook(
    request: HttpRequest,
    body: web::Bytes,
    provider: web::Data<dyn PaymentProvider>,
    subscriptions: web::Data<SubscriptionApplication>,
    voting: web::Data<VotingApplication>,
) -> Result<HttpResponse, AppError> {
    let signature = request
        .headers()
        .get("Paymongo-Signature")
        .and_then(|h| h.to_str().ok())
        .ok_or(AppError::Unauthorized)?;
    provider.verify_webhook(signature, &body)?;
    let event = CheckoutWebhookEvent::from_raw(&body)?;
    if event.livemode != provider.is_live_mode() {
        return Ok(HttpResponse::Ok().finish());
    }
    if event.event_type != "checkout_session.payment.paid" {
        return Ok(HttpResponse::Ok().finish());
    }
    let payload: serde_json::Value = serde_json::from_slice(&body)
        .map_err(|_| AppError::BadRequest("invalid PayMongo webhook payload".into()))?;
    let payments = payload["data"]["attributes"]["data"]["attributes"]["payments"]
        .as_array()
        .or_else(|| payload["data"]["data"]["attributes"]["payments"].as_array());
    let payment_id = payments.and_then(|payments| {
        payments
            .iter()
            .find(|payment| {
                payment["attributes"]["status"].as_str() == Some("paid")
                    || payment["status"].as_str() == Some("paid")
            })
            .or_else(|| payments.first())
            .and_then(|payment| payment["id"].as_str())
    });
    with_system_database_context(async {
        subscriptions
            .confirm_checkout(&event.checkout_session_id, payment_id)
            .await?;
        voting
            .confirm_checkout(&event.checkout_session_id, payment_id)
            .await?;
        Ok::<(), AppError>(())
    })
    .await?;
    Ok(HttpResponse::Ok().finish())
}

pub fn payment_routes(config: &mut web::ServiceConfig) {
    config.route(
        "/api/v1/payments/paymongo/webhook",
        web::post().to(paymongo_webhook),
    );
}
