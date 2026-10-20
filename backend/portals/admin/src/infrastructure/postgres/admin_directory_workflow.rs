use async_trait::async_trait;
use chrono::{DateTime, NaiveDate, NaiveTime, Utc};
use core_infra::AppError;
use sqlx::{FromRow, PgPool};
use uuid::Uuid;

use crate::{
    application::ports::admin_directory_workflow::AdminDirectoryWorkflow,
    domain::directory::{
        AdminOrganization, AdminOrganizationSubscription, AdminPageant, AdminUser,
        OrganizationOwner,
    },
};

pub struct PostgresAdminDirectoryWorkflow {
    pool: PgPool,
}

impl PostgresAdminDirectoryWorkflow {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

// ─── User rows ────────────────────────────────────────────────────────────────

#[derive(FromRow)]
struct AdminUserRow {
    id: Uuid,
    email: String,
    first_name: String,
    middle_name: Option<String>,
    last_name: String,
    phone: Option<String>,
    profile_image_url: Option<String>,
    status: String,
    role: String,
    email_verified_at: Option<DateTime<Utc>>,
    last_login_at: Option<DateTime<Utc>>,
    created_at: DateTime<Utc>,
}

impl From<AdminUserRow> for AdminUser {
    fn from(row: AdminUserRow) -> Self {
        Self {
            id: row.id,
            email: row.email,
            first_name: row.first_name,
            middle_name: row.middle_name,
            last_name: row.last_name,
            phone: row.phone,
            profile_image_url: row.profile_image_url,
            status: row.status,
            role: row.role,
            email_verified_at: row.email_verified_at,
            last_login_at: row.last_login_at,
            created_at: row.created_at,
        }
    }
}

// ─── Organization rows ────────────────────────────────────────────────────────

#[derive(FromRow)]
struct AdminOrganizationRow {
    id: Uuid,
    owner_id: Uuid,
    owner_email: String,
    owner_first_name: String,
    owner_last_name: String,
    owner_status: String,
    name: String,
    slug: String,
    description: Option<String>,
    logo_url: Option<String>,
    email: Option<String>,
    phone: Option<String>,
    address: Option<String>,
    is_active: bool,
    sub_plan_name: Option<String>,
    sub_plan_code: Option<String>,
    sub_status: Option<String>,
    payment_status: Option<String>,
    proof_status: Option<String>,
    created_at: DateTime<Utc>,
}

impl From<AdminOrganizationRow> for AdminOrganization {
    fn from(row: AdminOrganizationRow) -> Self {
        let subscription = match (row.sub_plan_name, row.sub_plan_code, row.sub_status) {
            (Some(plan_name), Some(plan_code), Some(status)) => {
                Some(AdminOrganizationSubscription {
                    plan_name,
                    plan_code,
                    status,
                    payment_status: row.payment_status,
                    proof_status: row.proof_status,
                })
            }
            _ => None,
        };
        Self {
            id: row.id,
            owner: OrganizationOwner {
                id: row.owner_id,
                email: row.owner_email,
                first_name: row.owner_first_name,
                last_name: row.owner_last_name,
                status: row.owner_status,
            },
            name: row.name,
            slug: row.slug,
            description: row.description,
            logo_url: row.logo_url,
            email: row.email,
            phone: row.phone,
            address: row.address,
            is_active: row.is_active,
            subscription,
            created_at: row.created_at,
        }
    }
}

// ─── Pageant rows ─────────────────────────────────────────────────────────────

#[derive(FromRow)]
struct AdminPageantRow {
    id: Uuid,
    organization_id: Uuid,
    organization_name: String,
    name: String,
    slug: String,
    description: Option<String>,
    logo_url: Option<String>,
    event_date: Option<NaiveDate>,
    start_time: Option<NaiveTime>,
    end_time: Option<NaiveTime>,
    venue: Option<String>,
    status: String,
    is_public: bool,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
}

impl From<AdminPageantRow> for AdminPageant {
    fn from(row: AdminPageantRow) -> Self {
        Self {
            id: row.id,
            organization_id: row.organization_id,
            organization_name: row.organization_name,
            name: row.name,
            slug: row.slug,
            description: row.description,
            logo_url: row.logo_url,
            event_date: row.event_date,
            start_time: row.start_time,
            end_time: row.end_time,
            venue: row.venue,
            status: row.status,
            is_public: row.is_public,
            created_at: row.created_at,
            updated_at: row.updated_at,
        }
    }
}

// ─── Column constants ─────────────────────────────────────────────────────────

/// Resolves the primary role using the same 6-priority logic as
/// UserRoleWorkflow::resolve_primary_role.
const ROLE_SUBQUERY: &str = "
    CASE
        WHEN EXISTS (
            SELECT 1 FROM user_system_roles usr
            INNER JOIN roles r ON r.id = usr.role_id
            WHERE usr.user_id = u.id AND r.scope = 'SYSTEM'::role_scope AND r.is_active = TRUE
        ) THEN 'admin'
        WHEN EXISTS (
            SELECT 1 FROM organization_members om
            INNER JOIN organization_member_roles omr ON omr.organization_member_id = om.id
            INNER JOIN roles r ON r.id = omr.role_id
            WHERE om.user_id = u.id AND om.is_active = TRUE AND omr.is_active = TRUE
              AND r.scope = 'ORGANIZATION'::role_scope AND r.is_active = TRUE AND r.code = 'ORG_OWNER'
        ) THEN 'org_owner'
        WHEN EXISTS (
            SELECT 1 FROM organization_members om
            INNER JOIN organization_member_roles omr ON omr.organization_member_id = om.id
            INNER JOIN roles r ON r.id = omr.role_id
            WHERE om.user_id = u.id AND om.is_active = TRUE AND omr.is_active = TRUE
              AND r.scope = 'ORGANIZATION'::role_scope AND r.is_active = TRUE AND r.code = 'ORG_COORDINATOR'
        ) THEN 'coordinator'
        WHEN EXISTS (
            SELECT 1 FROM pageant_member_roles pmr
            INNER JOIN roles r ON r.id = pmr.role_id
            WHERE pmr.user_id = u.id AND pmr.is_active = TRUE
              AND r.scope = 'PAGEANT'::role_scope AND r.is_active = TRUE AND r.code = 'PAGEANT_JUDGE'
        ) THEN 'judge'
        WHEN EXISTS (
            SELECT 1 FROM pageant_member_roles pmr
            INNER JOIN roles r ON r.id = pmr.role_id
            WHERE pmr.user_id = u.id AND pmr.is_active = TRUE
              AND r.scope = 'PAGEANT'::role_scope AND r.is_active = TRUE AND r.code = 'PAGEANT_TABULATOR'
        ) THEN 'tabulator'
        WHEN EXISTS (
            SELECT 1 FROM audience_voters WHERE user_id = u.id
        ) THEN 'audience'
        ELSE 'unknown'
    END
";

const USER_COLUMNS: &str = "u.id, u.email::text AS email, u.first_name, u.middle_name, u.last_name, \
    u.phone, u.profile_image_url, u.status::text AS status, u.email_verified_at, u.last_login_at, u.created_at";

const ORGANIZATION_COLUMNS: &str = "
    organization.id,
    owner.id AS owner_id,
    owner.email::text AS owner_email,
    owner.first_name AS owner_first_name,
    owner.last_name AS owner_last_name,
    owner.status::text AS owner_status,
    organization.name,
    organization.slug::text AS slug,
    organization.description,
    organization.logo_url,
    organization.email::text AS email,
    organization.phone,
    organization.address,
    organization.is_active,
    sp.name AS sub_plan_name,
    sp.code::text AS sub_plan_code,
    os.status::text AS sub_status,
    latest_payment.status AS payment_status,
    latest_proof.status AS proof_status,
    organization.created_at
";

const ORGANIZATION_FROM: &str = "
    FROM organizations organization
    INNER JOIN users owner ON owner.id = organization.owner_id
    LEFT JOIN LATERAL (
        SELECT subscription.* FROM organization_subscriptions subscription
        WHERE subscription.organization_id = organization.id
        ORDER BY subscription.created_at DESC, subscription.id DESC LIMIT 1
    ) os ON TRUE
    LEFT JOIN subscription_plans sp ON sp.id = os.plan_id
    LEFT JOIN LATERAL (
        SELECT payment.status::text AS status FROM payment_transactions payment
        WHERE payment.subscription_id = os.id ORDER BY payment.created_at DESC LIMIT 1
    ) latest_payment ON TRUE
    LEFT JOIN LATERAL (
        SELECT proof.status FROM subscription_payment_proofs proof
        WHERE proof.subscription_id = os.id ORDER BY proof.created_at DESC LIMIT 1
    ) latest_proof ON TRUE
";

const PAGEANT_COLUMNS: &str = "
    p.id,
    p.organization_id,
    o.name AS organization_name,
    p.name,
    p.slug::text AS slug,
    p.description,
    p.logo_url,
    p.event_date,
    p.start_time,
    p.end_time,
    p.venue,
    p.status::text AS status,
    p.is_public,
    p.created_at,
    p.updated_at
";

const PAGEANT_FROM: &str = "
    FROM pageants p
    INNER JOIN organizations o ON o.id = p.organization_id
";

// ─── Workflow implementation ───────────────────────────────────────────────────

#[async_trait]
impl AdminDirectoryWorkflow for PostgresAdminDirectoryWorkflow {
    async fn list_users(&self, limit: i64, offset: i64) -> Result<Vec<AdminUser>, AppError> {
        let query = format!(
            "SELECT {USER_COLUMNS}, ({ROLE_SUBQUERY}) AS role \
             FROM users u ORDER BY u.created_at DESC, u.id LIMIT $1 OFFSET $2"
        );
        let rows = sqlx::query_as::<_, AdminUserRow>(&query)
            .bind(limit)
            .bind(offset)
            .fetch_all(&self.pool)
            .await
            .map_err(database_error)?;
        Ok(rows.into_iter().map(AdminUser::from).collect())
    }

    async fn get_user(&self, id: Uuid) -> Result<AdminUser, AppError> {
        let query = format!(
            "SELECT {USER_COLUMNS}, ({ROLE_SUBQUERY}) AS role \
             FROM users u WHERE u.id = $1"
        );
        let row = sqlx::query_as::<_, AdminUserRow>(&query)
            .bind(id)
            .fetch_optional(&self.pool)
            .await
            .map_err(database_error)?
            .ok_or_else(|| AppError::NotFound("user".to_owned()))?;
        Ok(row.into())
    }

    async fn list_organizations(
        &self,
        limit: i64,
        offset: i64,
    ) -> Result<Vec<AdminOrganization>, AppError> {
        let query = format!(
            "SELECT {ORGANIZATION_COLUMNS} {ORGANIZATION_FROM} \
             ORDER BY organization.created_at DESC, organization.id LIMIT $1 OFFSET $2"
        );
        let rows = sqlx::query_as::<_, AdminOrganizationRow>(&query)
            .bind(limit)
            .bind(offset)
            .fetch_all(&self.pool)
            .await
            .map_err(database_error)?;
        Ok(rows.into_iter().map(AdminOrganization::from).collect())
    }

    async fn get_organization(&self, id: Uuid) -> Result<AdminOrganization, AppError> {
        let query = format!(
            "SELECT {ORGANIZATION_COLUMNS} {ORGANIZATION_FROM} \
             WHERE organization.id = $1"
        );
        let row = sqlx::query_as::<_, AdminOrganizationRow>(&query)
            .bind(id)
            .fetch_optional(&self.pool)
            .await
            .map_err(database_error)?
            .ok_or_else(|| AppError::NotFound("organization".to_owned()))?;
        Ok(row.into())
    }

    async fn list_pageants(&self, limit: i64, offset: i64) -> Result<Vec<AdminPageant>, AppError> {
        let query = format!(
            "SELECT {PAGEANT_COLUMNS} {PAGEANT_FROM} \
             ORDER BY p.created_at DESC, p.id LIMIT $1 OFFSET $2"
        );
        let rows = sqlx::query_as::<_, AdminPageantRow>(&query)
            .bind(limit)
            .bind(offset)
            .fetch_all(&self.pool)
            .await
            .map_err(database_error)?;
        Ok(rows.into_iter().map(AdminPageant::from).collect())
    }

    async fn get_pageant(&self, id: Uuid) -> Result<AdminPageant, AppError> {
        let query = format!(
            "SELECT {PAGEANT_COLUMNS} {PAGEANT_FROM} \
             WHERE p.id = $1"
        );
        let row = sqlx::query_as::<_, AdminPageantRow>(&query)
            .bind(id)
            .fetch_optional(&self.pool)
            .await
            .map_err(database_error)?
            .ok_or_else(|| AppError::NotFound("pageant".to_owned()))?;
        Ok(row.into())
    }
}

fn database_error(error: sqlx::Error) -> AppError {
    AppError::Database(Box::new(error))
}
