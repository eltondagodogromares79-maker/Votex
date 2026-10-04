use crate::{
    AppError,
    domain::payments::{CheckoutRequest, CheckoutSession},
};
use async_trait::async_trait;

#[async_trait]
pub trait PaymentProvider: Send + Sync {
    async fn create_checkout(&self, request: &CheckoutRequest)
    -> Result<CheckoutSession, AppError>;
    fn verify_webhook(&self, signature: &str, raw_body: &[u8]) -> Result<(), AppError>;
    fn is_live_mode(&self) -> bool;
}
