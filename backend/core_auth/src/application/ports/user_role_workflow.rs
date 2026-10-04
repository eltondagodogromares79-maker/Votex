use async_trait::async_trait;
use uuid::Uuid;

use core_infra::AppError;

/// Resolves the primary role of an authenticated user.
///
/// Role priority (highest wins):
///   1. PLATFORM_ADMIN  — user_system_roles (SYSTEM scope)
///   2. ORG_OWNER       — organization_member_roles (ORGANIZATION scope, code = ORG_OWNER)
///   3. ORG_COORDINATOR — organization_member_roles (ORGANIZATION scope, code = ORG_COORDINATOR)
///   4. PAGEANT_JUDGE   — pageant_member_roles (PAGEANT scope, code = PAGEANT_JUDGE)
///   5. PAGEANT_TABULATOR — pageant_member_roles (PAGEANT scope, code = PAGEANT_TABULATOR)
///   6. audience        — audience_voters table
///
/// Returns the role code as a lowercase string matching FrontendRole on the client:
///   "admin" | "org_owner" | "coordinator" | "judge" | "tabulator" | "audience"
///
/// Returns AppError::NotFound if no role can be resolved for the user.
#[cfg_attr(test, mockall::automock)]
#[async_trait]
pub trait UserRoleWorkflow: Send + Sync {
    async fn resolve_primary_role(&self, user_id: Uuid) -> Result<String, AppError>;
}
