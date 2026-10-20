use serde::Serialize;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ScoringCriterion {
    pub round_criterion_id: Uuid,
    pub criterion_id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub minimum_score: rust_decimal::Decimal,
    pub maximum_score: rust_decimal::Decimal,
    pub weight_percentage: rust_decimal::Decimal,
    pub display_order: i32,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SavedCriterionScore {
    pub round_criterion_id: Uuid,
    pub raw_score: rust_decimal::Decimal,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ScoringCandidate {
    pub id: Uuid,
    pub contestant_number: i32,
    pub display_name: String,
    pub gender: Option<String>,
    pub photo_url: Option<String>,
    pub biography: Option<String>,
    pub submission_status: Option<String>,
    pub scores: Vec<SavedCriterionScore>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CategoryScoringWorkspace {
    pub round_id: Uuid,
    pub round_name: String,
    pub category_id: Uuid,
    pub category_name: String,
    pub eligibility_scope: String,
    pub criteria: Vec<ScoringCriterion>,
    pub candidates: Vec<ScoringCandidate>,
}

#[derive(Debug, Clone, serde::Deserialize)]
pub struct CriterionScoreInput {
    #[serde(alias = "roundCriterionId")]
    pub round_criterion_id: Uuid,
    #[serde(alias = "rawScore")]
    pub raw_score: rust_decimal::Decimal,
}

#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ScoreSubmissionResult {
    pub contestant_id: Uuid,
    pub status: String,
    pub saved_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CategorySubmissionResult {
    pub category_id: Uuid,
    pub status: String,
    pub candidate_count: usize,
    pub submitted_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Clone, Serialize)]
pub struct Category {
    pub id: Uuid,
    pub pageant_id: Uuid,
    pub round_id: Option<Uuid>,
    pub code: String,
    pub name: String,
    pub description: Option<String>,
    pub display_order: i32,
    pub eligibility_scope: String,
    pub is_active: bool,
    pub status: String,
}
#[derive(Debug, Clone, Serialize)]
pub struct Criterion {
    pub id: Uuid,
    pub pageant_id: Uuid,
    pub code: String,
    pub name: String,
    pub description: Option<String>,
    pub default_maximum_score: rust_decimal::Decimal,
    pub default_minimum_score: rust_decimal::Decimal,
    pub is_active: bool,
}
