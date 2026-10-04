use uuid::Uuid;

#[derive(Debug, Clone)]
pub struct OrganizationCoordinator {
    pub organization_id: Uuid,
    pub user_id: Uuid,
    pub email: String,
    pub first_name: String,
    pub last_name: String,
    pub is_active: bool,
}
