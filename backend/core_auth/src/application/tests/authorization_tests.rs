use std::sync::Arc;

use mockall::predicate::eq;
use uuid::Uuid;

use crate::application::authorization::AuthorizationApplication;
use crate::application::ports::authorization_workflow::{
    AuthorizationScope, MockAuthorizationWorkflow,
};

#[tokio::test]
async fn authorize_succeeds_when_permission_is_granted() {
    let user_id = Uuid::new_v4();
    let organization_id = Uuid::new_v4();

    let mut workflow = MockAuthorizationWorkflow::new();

    workflow
        .expect_has_permission()
        .with(
            eq(user_id),
            eq(AuthorizationScope::Organization { organization_id }),
            eq("organization.update"),
        )
        .returning(|_, _, _| Ok(true));

    let application = AuthorizationApplication::new(Arc::new(workflow));

    let result = application
        .authorize(
            user_id,
            AuthorizationScope::Organization { organization_id },
            "organization.update",
        )
        .await;

    assert!(result.is_ok());
}

#[tokio::test]
async fn authorize_returns_forbidden_when_permission_is_denied() {
    let user_id = Uuid::new_v4();
    let organization_id = Uuid::new_v4();

    let mut workflow = MockAuthorizationWorkflow::new();

    workflow
        .expect_has_permission()
        .with(
            eq(user_id),
            eq(AuthorizationScope::Organization { organization_id }),
            eq("organization.update"),
        )
        .returning(|_, _, _| Ok(false));

    let application = AuthorizationApplication::new(Arc::new(workflow));

    let result = application
        .authorize(
            user_id,
            AuthorizationScope::Organization { organization_id },
            "organization.update",
        )
        .await;

    assert!(matches!(result, Err(core_infra::AppError::Forbidden)));
}

#[tokio::test]
async fn authorize_propagates_workflow_error() {
    let user_id = Uuid::new_v4();

    let mut workflow = MockAuthorizationWorkflow::new();

    workflow
        .expect_has_permission()
        .with(
            eq(user_id),
            eq(AuthorizationScope::System),
            eq("audit.read"),
        )
        .returning(|_, _, _| Err(core_infra::AppError::Database("test database error".into())));

    let application = AuthorizationApplication::new(Arc::new(workflow));

    let result = application
        .authorize(user_id, AuthorizationScope::System, "audit.read")
        .await;

    assert!(matches!(result, Err(core_infra::AppError::Database(_))));
}
