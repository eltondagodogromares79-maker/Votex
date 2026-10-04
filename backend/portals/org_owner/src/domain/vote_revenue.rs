use rust_decimal::Decimal;
use serde::Serialize;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize)]
pub struct VoteRevenueTotal {
    pub currency: String,
    pub amount: Decimal,
    pub completed_transactions: i64,
    pub votes_sold: i64,
}

#[derive(Debug, Clone, Serialize)]
pub struct PageantVoteRevenue {
    pub pageant_id: Uuid,
    pub pageant_name: String,
    pub currency: String,
    pub amount: Decimal,
    pub completed_transactions: i64,
    pub votes_sold: i64,
}

#[derive(Debug, Clone, Serialize)]
pub struct CandidateVoteRevenue {
    pub pageant_id: Uuid,
    pub pageant_name: String,
    pub candidate_id: Uuid,
    pub candidate_name: String,
    pub currency: String,
    pub amount: Decimal,
    pub completed_transactions: i64,
    pub votes_sold: i64,
}

#[derive(Debug, Clone, Serialize)]
pub struct VoteRevenueReport {
    pub totals_by_currency: Vec<VoteRevenueTotal>,
    pub pageants: Vec<PageantVoteRevenue>,
    pub candidates: Vec<CandidateVoteRevenue>,
}
