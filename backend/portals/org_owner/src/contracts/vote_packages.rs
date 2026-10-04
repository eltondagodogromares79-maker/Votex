use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

use crate::domain::vote_package::VotePackage;

#[derive(Debug, Deserialize, Validate)]
pub struct CreateVotePackageRequest {
    #[validate(length(min = 1, max = 150))]
    pub name: String,
    pub description: Option<String>,
    #[validate(range(min = 1))]
    pub vote_quantity: i32,
    pub price_amount: Decimal,
    #[serde(default = "default_currency")]
    pub currency: String,
}

#[derive(Debug, Deserialize, Validate)]
pub struct UpdateVotePackageRequest {
    #[validate(length(min = 1, max = 150))]
    pub name: String,
    pub description: Option<String>,
    #[validate(range(min = 1))]
    pub vote_quantity: i32,
    pub price_amount: Decimal,
    pub currency: String,
}

#[derive(Debug, Serialize)]
pub struct VotePackageResponse {
    pub id: Uuid,
    pub pageant_id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub vote_quantity: i32,
    pub price_amount: Decimal,
    pub currency: String,
    pub is_active: bool,
}

impl From<VotePackage> for VotePackageResponse {
    fn from(package: VotePackage) -> Self {
        Self {
            id: package.id,
            pageant_id: package.pageant_id,
            name: package.name,
            description: package.description,
            vote_quantity: package.vote_quantity,
            price_amount: package.price_amount,
            currency: package.currency,
            is_active: package.is_active,
        }
    }
}

fn default_currency() -> String {
    "PHP".to_owned()
}
