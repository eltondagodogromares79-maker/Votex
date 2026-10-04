use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::domain::revenue::{OrganizationRevenue, RevenueReport, RevenueTotal};

#[derive(Debug, Deserialize)]
pub struct RevenueQuery {
    pub organization_id: Option<Uuid>,
    pub from: Option<DateTime<Utc>>,
    pub to: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize)]
pub struct RevenueTotalResponse {
    pub currency: String,
    pub amount: Decimal,
    pub completed_transactions: i64,
}

impl From<RevenueTotal> for RevenueTotalResponse {
    fn from(total: RevenueTotal) -> Self {
        Self {
            currency: total.currency,
            amount: total.amount,
            completed_transactions: total.completed_transactions,
        }
    }
}

#[derive(Debug, Serialize)]
pub struct OrganizationRevenueResponse {
    pub organization_id: Uuid,
    pub organization_name: String,
    pub currency: String,
    pub amount: Decimal,
    pub completed_transactions: i64,
}

impl From<OrganizationRevenue> for OrganizationRevenueResponse {
    fn from(item: OrganizationRevenue) -> Self {
        Self {
            organization_id: item.organization_id,
            organization_name: item.organization_name,
            currency: item.currency,
            amount: item.amount,
            completed_transactions: item.completed_transactions,
        }
    }
}

#[derive(Debug, Serialize)]
pub struct RevenueReportResponse {
    pub basis: &'static str,
    pub totals_by_currency: Vec<RevenueTotalResponse>,
    pub organizations: Vec<OrganizationRevenueResponse>,
}

impl From<RevenueReport> for RevenueReportResponse {
    fn from(report: RevenueReport) -> Self {
        Self {
            basis: "completed subscription payment transactions (gross income)",
            totals_by_currency: report
                .totals_by_currency
                .into_iter()
                .map(RevenueTotalResponse::from)
                .collect(),
            organizations: report
                .organizations
                .into_iter()
                .map(OrganizationRevenueResponse::from)
                .collect(),
        }
    }
}
