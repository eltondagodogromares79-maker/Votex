use crate::{AppError, config::PaymentConfig};
use crate::{
    application::ports::payment_provider::PaymentProvider,
    domain::payments::{CheckoutRequest, CheckoutSession},
};
use hmac::{Hmac, KeyInit, Mac};
use reqwest::Client;
use serde::Deserialize;
use sha2::Sha256;
use std::time::Duration;

type HmacSha256 = Hmac<Sha256>;
fn external(message: &'static str) -> AppError {
    AppError::ExternalService(Box::new(std::io::Error::other(message)))
}
pub struct PayMongoClient {
    http: Client,
    secret_key: String,
    webhook_secret: String,
    success_url: String,
    cancel_url: String,
    payment_methods: Vec<String>,
}
impl PayMongoClient {
    pub fn new(config: &PaymentConfig) -> Result<Self, reqwest::Error> {
        let http = Client::builder()
            .https_only(true)
            .connect_timeout(Duration::from_secs(5))
            .timeout(Duration::from_secs(20))
            .build()?;
        Ok(Self {
            http,
            secret_key: config.paymongo_secret_key.clone(),
            webhook_secret: config.paymongo_webhook_secret.clone(),
            success_url: config.paymongo_success_url.clone(),
            cancel_url: config.paymongo_cancel_url.clone(),
            payment_methods: config.paymongo_payment_methods.clone(),
        })
    }
    fn ensure_configured(&self) -> Result<(), AppError> {
        if !self.secret_key.starts_with("sk_") || self.webhook_secret.trim().is_empty() {
            return Err(AppError::Configuration(
                "PayMongo keys are not configured".into(),
            ));
        }
        Ok(())
    }
}
#[derive(Deserialize)]
struct CreateResponse {
    data: SessionData,
}
#[derive(Deserialize)]
struct SessionData {
    id: String,
    attributes: SessionAttributes,
}
#[derive(Deserialize)]
struct SessionAttributes {
    checkout_url: String,
}
#[async_trait::async_trait]
impl PaymentProvider for PayMongoClient {
    async fn create_checkout(
        &self,
        request: &CheckoutRequest,
    ) -> Result<CheckoutSession, AppError> {
        self.ensure_configured()?;
        if request.amount_minor <= 0
            || request.currency != "PHP"
            || request.idempotency_key.trim().is_empty()
        {
            return Err(AppError::BadRequest(
                "invalid checkout amount, currency, or idempotency key".into(),
            ));
        }
        let payload = serde_json::json!({"data":{"attributes":{
            "line_items":[{"name":request.item_name,"description":request.description,"amount":request.amount_minor,"currency":request.currency,"quantity":1}],
            "payment_method_types":self.payment_methods,
            "success_url":self.success_url,
            "cancel_url":self.cancel_url,
            "reference_number":request.reference_number,
            "description":request.description
        }}});
        let response = self
            .http
            .post("https://api.paymongo.com/v2/checkout_sessions")
            .basic_auth(&self.secret_key, Some(""))
            .header("Idempotency-Key", &request.idempotency_key)
            .json(&payload)
            .send()
            .await
            .map_err(|_| external("PayMongo checkout request failed"))?;
        if !response.status().is_success() {
            tracing::error!(status=%response.status(), "PayMongo rejected checkout creation");
            return Err(external("PayMongo could not create checkout"));
        }
        let result: CreateResponse = response
            .json()
            .await
            .map_err(|_| external("invalid PayMongo checkout response"))?;
        Ok(CheckoutSession {
            id: result.data.id,
            checkout_url: result.data.attributes.checkout_url,
        })
    }
    fn verify_webhook(&self, signature: &str, raw_body: &[u8]) -> Result<(), AppError> {
        self.ensure_configured()?;
        let mut timestamp = None;
        let mut test_signature = None;
        let mut live_signature = None;
        for part in signature.split(',') {
            let Some((key, value)) = part.trim().split_once('=') else {
                continue;
            };
            match key {
                "t" => timestamp = Some(value),
                "te" => test_signature = Some(value),
                "li" => live_signature = Some(value),
                _ => {}
            }
        }
        let timestamp = timestamp.ok_or(AppError::Unauthorized)?;
        timestamp
            .parse::<u64>()
            .map_err(|_| AppError::Unauthorized)?;
        let expected_live = self.is_live_mode();
        let supplied = if expected_live {
            live_signature
        } else {
            test_signature
        }
        .filter(|v| !v.is_empty())
        .ok_or(AppError::Unauthorized)?;
        let mut mac = HmacSha256::new_from_slice(self.webhook_secret.as_bytes())
            .map_err(|_| AppError::Internal)?;
        mac.update(timestamp.as_bytes());
        mac.update(b".");
        mac.update(raw_body);
        let bytes = hex::decode(supplied).map_err(|_| AppError::Unauthorized)?;
        mac.verify_slice(&bytes).map_err(|_| AppError::Unauthorized)
    }
    fn is_live_mode(&self) -> bool {
        self.secret_key.starts_with("sk_live_")
    }
}
