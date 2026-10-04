use uuid::Uuid;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PageantStaffRole {
    Coordinator,
    Judge,
    Tabulator,
}

impl PageantStaffRole {
    pub fn role_code(self) -> &'static str {
        match self {
            Self::Coordinator => "PAGEANT_COORDINATOR",
            Self::Judge => "PAGEANT_JUDGE",
            Self::Tabulator => "PAGEANT_TABULATOR",
        }
    }
}

#[derive(Debug, Clone)]
pub struct PageantStaffMember {
    pub user_id: Uuid,
    pub email: String,
    pub first_name: String,
    pub last_name: String,
    pub role: PageantStaffRole,
    pub is_active: bool,
}
