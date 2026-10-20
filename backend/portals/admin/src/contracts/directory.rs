use chrono::{DateTime, NaiveDate, NaiveTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::domain::directory::{
    AdminOrganization, AdminOrganizationSubscription, AdminPageant, AdminUser, OrganizationOwner,
};

#[derive(Debug, Deserialize)]
pub struct DirectoryQuery {
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

impl DirectoryQuery {
    pub fn bounded_values(&self) -> (i64, i64) {
        (
            self.limit.unwrap_or(50).clamp(1, 100),
            self.offset.unwrap_or(0).max(0),
        )
    }
}

#[derive(Debug, Serialize)]
pub struct DirectoryPage<T> {
    pub items: Vec<T>,
    pub limit: i64,
    pub offset: i64,
}

#[derive(Debug, Serialize)]
pub struct AdminUserResponse {
    pub id: Uuid,
    pub email: String,
    pub first_name: String,
    pub middle_name: Option<String>,
    pub last_name: String,
    pub phone: Option<String>,
    pub profile_image_url: Option<String>,
    pub status: String,
    pub role: String,
    pub email_verified_at: Option<DateTime<Utc>>,
    pub last_login_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

impl From<AdminUser> for AdminUserResponse {
    fn from(user: AdminUser) -> Self {
        Self {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            middle_name: user.middle_name,
            last_name: user.last_name,
            phone: user.phone,
            profile_image_url: user.profile_image_url,
            status: user.status,
            role: user.role,
            email_verified_at: user.email_verified_at,
            last_login_at: user.last_login_at,
            created_at: user.created_at,
        }
    }
}

#[derive(Debug, Serialize)]
pub struct OrganizationOwnerResponse {
    pub id: Uuid,
    pub email: String,
    pub first_name: String,
    pub last_name: String,
    pub status: String,
}

impl From<OrganizationOwner> for OrganizationOwnerResponse {
    fn from(owner: OrganizationOwner) -> Self {
        Self {
            id: owner.id,
            email: owner.email,
            first_name: owner.first_name,
            last_name: owner.last_name,
            status: owner.status,
        }
    }
}

#[derive(Debug, Serialize)]
pub struct AdminOrganizationSubscriptionResponse {
    pub plan_name: String,
    pub plan_code: String,
    pub status: String,
    pub payment_status: Option<String>,
    pub proof_status: Option<String>,
}

impl From<AdminOrganizationSubscription> for AdminOrganizationSubscriptionResponse {
    fn from(s: AdminOrganizationSubscription) -> Self {
        Self {
            plan_name: s.plan_name,
            plan_code: s.plan_code,
            status: s.status,
            payment_status: s.payment_status,
            proof_status: s.proof_status,
        }
    }
}

#[derive(Debug, Serialize)]
pub struct AdminOrganizationResponse {
    pub id: Uuid,
    pub owner: OrganizationOwnerResponse,
    pub name: String,
    pub slug: String,
    pub description: Option<String>,
    pub logo_url: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub address: Option<String>,
    pub is_active: bool,
    pub subscription: Option<AdminOrganizationSubscriptionResponse>,
    pub created_at: DateTime<Utc>,
}

impl From<AdminOrganization> for AdminOrganizationResponse {
    fn from(organization: AdminOrganization) -> Self {
        Self {
            id: organization.id,
            owner: organization.owner.into(),
            name: organization.name,
            slug: organization.slug,
            description: organization.description,
            logo_url: organization.logo_url,
            email: organization.email,
            phone: organization.phone,
            address: organization.address,
            is_active: organization.is_active,
            subscription: organization
                .subscription
                .map(AdminOrganizationSubscriptionResponse::from),
            created_at: organization.created_at,
        }
    }
}

#[derive(Debug, Serialize)]
pub struct AdminPageantResponse {
    pub id: Uuid,
    pub organization_id: Uuid,
    pub organization_name: String,
    pub name: String,
    pub slug: String,
    pub description: Option<String>,
    pub logo_url: Option<String>,
    pub event_date: Option<NaiveDate>,
    pub start_time: Option<NaiveTime>,
    pub end_time: Option<NaiveTime>,
    pub venue: Option<String>,
    pub status: String,
    pub is_public: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl From<AdminPageant> for AdminPageantResponse {
    fn from(p: AdminPageant) -> Self {
        Self {
            id: p.id,
            organization_id: p.organization_id,
            organization_name: p.organization_name,
            name: p.name,
            slug: p.slug,
            description: p.description,
            logo_url: p.logo_url,
            event_date: p.event_date,
            start_time: p.start_time,
            end_time: p.end_time,
            venue: p.venue,
            status: p.status,
            is_public: p.is_public,
            created_at: p.created_at,
            updated_at: p.updated_at,
        }
    }
}
