use std::sync::Arc;

use core_infra::{AppError, db::with_verified_database_user_context};

use crate::{
    application::ports::{
        refresh_token_workflow::RefreshTokenWorkflow, token_issuer::TokenIssuer,
        user_role_workflow::UserRoleWorkflow,
    },
    contracts::login::RefreshTokenResponse,
};

pub struct RefreshTokenApplication {
    refresh_token_workflow: Arc<dyn RefreshTokenWorkflow>,
    token_issuer: Arc<dyn TokenIssuer>,
    user_role_workflow: Arc<dyn UserRoleWorkflow>,
}

impl RefreshTokenApplication {
    pub fn new(
        refresh_token_workflow: Arc<dyn RefreshTokenWorkflow>,
        token_issuer: Arc<dyn TokenIssuer>,
        user_role_workflow: Arc<dyn UserRoleWorkflow>,
    ) -> Self {
        Self {
            refresh_token_workflow,
            token_issuer,
            user_role_workflow,
        }
    }

    pub async fn refresh(
        &self,
        refresh_token: &str,
    ) -> Result<(RefreshTokenResponse, String), AppError> {
        // 1. Validate the refresh token, rotate it, and load the associated user.
        let session_result = self
            .refresh_token_workflow
            .refresh_session(refresh_token)
            .await?;

        // 2. Re-resolve the user's current primary role from the database.
        //    Role can change between sessions (e.g. org_owner loses membership),
        //    so we always re-query rather than trusting the old token's rol claim.
        let role = with_verified_database_user_context(
            session_result.user.id,
            self.user_role_workflow
                .resolve_primary_role(session_result.user.id),
        )
        .await?;

        // 3. Issue a new access token with the current role embedded.
        let access_token = self
            .token_issuer
            .issue_access_token(&session_result.user, &session_result.session, &role)
            .await?;

        let response = RefreshTokenResponse {
            access_token: access_token.token,
            token_type: "Bearer".to_string(),
            expires_in: access_token.expires_in,
        };

        Ok((response, session_result.refresh_token))
    }
}
