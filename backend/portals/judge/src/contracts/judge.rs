use crate::domain::{
    contestant::Contestant,
    pageant::AssignedPageant,
    round::Round,
    setup::{Category, Criterion},
};
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
