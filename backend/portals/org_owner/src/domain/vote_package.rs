use rust_decimal::Decimal;
use uuid::Uuid;

#[derive(Debug, Clone)]
pub struct VotePackage {
    pub id: Uuid,
    pub pageant_id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub vote_quantity: i32,
    pub price_amount: Decimal,
    pub currency: String,
    pub is_active: bool,
    pub created_by: Option<Uuid>,
}
