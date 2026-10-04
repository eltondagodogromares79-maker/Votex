use crate::domain::voting::{VoteCandidate, VoteCheckout, VotePackage};
use async_trait::async_trait;
use core_infra::AppError;
use uuid::Uuid;
#[async_trait]
pub trait VotingWorkflow: Send + Sync {
    async fn packages(&self, pageant: Uuid) -> Result<Vec<VotePackage>, AppError>;
    async fn candidates(&self, pageant: Uuid) -> Result<Vec<VoteCandidate>, AppError>;
    async fn start_vote(
        &self,
        user: Uuid,
        pageant: Uuid,
        candidate: Uuid,
        package: Uuid,
        key: &str,
    ) -> Result<(VoteCheckout, i64, String), AppError>;
    async fn attach_checkout(
        &self,
        vote_id: Uuid,
        session_id: &str,
        url: &str,
    ) -> Result<(), AppError>;
    async fn status(&self, user: Uuid, vote_id: Uuid) -> Result<VoteCheckout, AppError>;
    async fn confirm_checkout(
        &self,
        session_id: &str,
        payment_id: Option<&str>,
    ) -> Result<bool, AppError>;
}
