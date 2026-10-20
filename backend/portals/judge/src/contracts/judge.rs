use crate::domain::setup::CriterionScoreInput;
use crate::domain::{
    contestant::Contestant,
    pageant::AssignedPageant,
    round::Round,
    setup::{Category, Criterion},
};
use serde::Deserialize;
use serde::Serialize;

#[derive(Debug, Serialize)]
#[serde(transparent)]
pub struct AssignedPageantResponse(pub AssignedPageant);
#[derive(Debug, Serialize)]
#[serde(transparent)]
pub struct ContestantResponse(pub Contestant);
#[derive(Debug, Serialize)]
#[serde(transparent)]
pub struct RoundResponse(pub Round);
#[derive(Debug, Serialize)]
#[serde(transparent)]
pub struct CategoryResponse(pub Category);
#[derive(Debug, Serialize)]
#[serde(transparent)]
pub struct CriterionResponse(pub Criterion);

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SubmitCategoryScoresRequest {
    pub scores: Vec<CriterionScoreInput>,
}
