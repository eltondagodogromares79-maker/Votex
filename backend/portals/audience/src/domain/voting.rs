use rust_decimal::Decimal;
use serde::Serialize;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize)]
pub struct VotePackage {
    pub id: Uuid,
    pub pageant_id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub vote_quantity: i32,
    pub price_amount: Decimal,
    pub currency: String,
}
#[derive(Debug, Clone, Serialize)]
pub struct VoteCandidate {
    pub id: Uuid,
    pub contestant_number: i32,
    pub display_name: String,
    pub photo_url: Option<String>,
    pub biography: Option<String>,
}
#[derive(Debug, Clone, Serialize)]
pub struct VoteCheckout {
    pub id: Uuid,
    pub contestant_id: Uuid,
    pub package_id: Uuid,
    pub quantity: i32,
    pub amount: Decimal,
    pub currency: String,
    pub status: String,
    pub checkout_url: Option<String>,
}
