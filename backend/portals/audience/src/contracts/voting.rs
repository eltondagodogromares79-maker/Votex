use crate::domain::voting::{VoteCandidate, VoteCheckout, VotePackage};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;
#[derive(Debug, Deserialize, Validate)]
pub struct StartVoteRequest {
    pub contestant_id: Uuid,
    pub package_id: Uuid,
}
#[derive(Debug, Serialize)]
#[serde(transparent)]
pub struct VotePackageResponse(pub VotePackage);
#[derive(Debug, Serialize)]
#[serde(transparent)]
pub struct VoteCandidateResponse(pub VoteCandidate);
#[derive(Debug, Serialize)]
#[serde(transparent)]
pub struct VoteCheckoutResponse(pub VoteCheckout);
