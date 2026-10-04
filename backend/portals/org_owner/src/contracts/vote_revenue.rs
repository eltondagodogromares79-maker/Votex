use crate::domain::vote_revenue::{
    CandidateVoteRevenue, PageantVoteRevenue, VoteRevenueReport, VoteRevenueTotal,
};
use chrono::{DateTime, Utc};
use serde::Deserialize;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct VoteRevenueQuery {
    pub pageant_id: Option<Uuid>,
    pub candidate_id: Option<Uuid>,
    pub from: Option<DateTime<Utc>>,
    pub to: Option<DateTime<Utc>>,
}

#[derive(Debug, serde::Serialize)]
pub struct VoteRevenueReportResponse {
    pub basis: &'static str,
    pub totals_by_currency: Vec<VoteRevenueTotal>,
    pub pageants: Vec<PageantVoteRevenue>,
    pub candidates: Vec<CandidateVoteRevenue>,
}

impl From<VoteRevenueReport> for VoteRevenueReportResponse {
    fn from(report: VoteRevenueReport) -> Self {
        Self {
            basis: "completed audience vote payment transactions (gross income)",
            totals_by_currency: report.totals_by_currency,
            pageants: report.pageants,
            candidates: report.candidates,
        }
    }
}
