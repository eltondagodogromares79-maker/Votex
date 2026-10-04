use uuid::Uuid;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PageantStaffRole {
    Judge,
    Tabulator,
}
impl PageantStaffRole {
    pub fn as_db_code(self) -> &'static str {
        match self {
            Self::Judge => "PAGEANT_JUDGE",
            Self::Tabulator => "PAGEANT_TABULATOR",
        }
    }
}

#[derive(Debug, Clone)]
pub struct PageantJudge {
    pub pageant_id: Uuid,
    pub user_id: Uuid,
    pub email: String,
    pub first_name: String,
    pub last_name: String,
    pub is_active: bool,
    pub role: PageantStaffRole,
}
