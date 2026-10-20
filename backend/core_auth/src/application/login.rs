use std::{net::IpAddr, sync::Arc};

use core_infra::{AppError, db::with_verified_database_user_context};

use crate::{
    application::ports::{
        authentication_workflow::AuthenticationWorkflow, session_workflow::SessionWorkflow,
        token_issuer::TokenIssuer, user_role_workflow::UserRoleWorkflow,
    },
    contracts::login::{LoginRequest, LoginResult},
};

pub struct AuthenticationApplication {
    authentication_workflow: Arc<dyn AuthenticationWorkflow>,
    session_workflow: Arc<dyn SessionWorkflow>,
    token_issuer: Arc<dyn TokenIssuer>,
    user_role_workflow: Arc<dyn UserRoleWorkflow>,
}

impl AuthenticationApplication {
    pub fn new(
        authentication_workflow: Arc<dyn AuthenticationWorkflow>,
        session_workflow: Arc<dyn SessionWorkflow>,
        token_issuer: Arc<dyn TokenIssuer>,
        user_role_workflow: Arc<dyn UserRoleWorkflow>,
    ) -> Self {
        Self {
            authentication_workflow,
            session_workflow,
            token_issuer,
            user_role_workflow,
        }
    }

    pub async fn login(
        &self,
        request: LoginRequest,
        user_agent: Option<&str>,
        ip_address: Option<IpAddr>,
    ) -> Result<LoginResult, AppError> {
        // 1. Validate credentials and load the User domain model
        let user = self
            .authentication_workflow
            .authenticate(&request.email, &request.password)
            .await?;

        // 2. Resolve the user's primary role after validating credentials.
        //    RLS needs this trusted user context to read tenant memberships.
        let role = with_verified_database_user_context(
            user.id,
            self.user_role_workflow.resolve_primary_role(user.id),
        )
        .await?;

        // 3. Create a session only after role resolution succeeds.
        let session_result = self
            .session_workflow
            .create_session(user.id, user_agent.map(str::to_owned), ip_address)
            .await?;

        // 4. Issue a signed access token embedding the role claim
        let access_token = self
            .token_issuer
            .issue_access_token(&user, &session_result.session, &role)
            .await?;

        Ok(LoginResult {
            access_token: access_token.token,
            token_type: "Bearer".to_string(),
            expires_in: access_token.expires_in,
            refresh_token: session_result.refresh_token,
        })
    }
}
