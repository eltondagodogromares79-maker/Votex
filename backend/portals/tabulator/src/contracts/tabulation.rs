use crate::domain::{
    advancement::Advancement,
    contestant::Contestant,
    pageant::AssignedPageant,
    results::RoundResultEntry,
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
#[derive(Debug, Serialize)]
#[serde(transparent)]
pub struct AdvancementResponse(pub Advancement);
#[derive(Debug, Serialize)]
#[serde(transparent)]
pub struct RoundResultResponse(pub RoundResultEntry);
