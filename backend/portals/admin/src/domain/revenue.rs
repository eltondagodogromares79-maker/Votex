use rust_decimal::Decimal;
use uuid::Uuid;

#[derive(Debug, Clone)]
pub struct RevenueTotal {
    pub currency: String,
    pub amount: Decimal,
    pub completed_transactions: i64,
}

#[derive(Debug, Clone)]
pub struct OrganizationRevenue {
    pub organization_id: Uuid,
    pub organization_name: String,
    pub currency: String,
    pub amount: Decimal,
    pub completed_transactions: i64,
}

#[derive(Debug, Clone)]
pub struct RevenueReport {
    pub totals_by_currency: Vec<RevenueTotal>,
    pub organizations: Vec<OrganizationRevenue>,
}
