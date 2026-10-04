use std::sync::Arc;

use actix_web::{App, HttpResponse, http::StatusCode, test, web};
use async_trait::async_trait;
use uuid::Uuid;

use crate::{
    api::middleware::{authentication::JwtAuthentication, authorization::AuthorizationGuard},
    application::{
        authorization::AuthorizationApplication,
        ports::{
            authorization_workflow::{AuthorizationScope, MockAuthorizationWorkflow},
            token_validator::TokenValidator,
        },
    },
    domain::models::authenticated_user::AuthenticatedUser,
};

struct TestTokenValidator {
    user_id: Uuid,
}

#[async_trait]
impl TokenValidator for TestTokenValidator {
    async fn validate_access_token(
        &self,
        token: &str,
    ) -> Result<AuthenticatedUser, core_infra::AppError> {
        if token != "valid-test-token" {
            return Err(core_infra::AppError::InvalidToken);
        }
        Ok(AuthenticatedUser {
            user_id: self.user_id,
            session_id: Uuid::new_v4(),
            role: "test".to_string(),
        })
    }
}

async fn ok() -> HttpResponse {
    HttpResponse::Ok().finish()
}

fn authorization(allowed: bool, user_id: Uuid, org_id: Uuid) -> Arc<AuthorizationApplication> {
    let mut workflow = MockAuthorizationWorkflow::new();
    workflow
        .expect_has_permission()
        .returning(move |user, scope, permission| {
            assert_eq!(user, user_id);
            assert_eq!(
                scope,
                AuthorizationScope::Organization {
                    organization_id: org_id
                }
            );
            assert_eq!(permission, "organization.read");
            Ok(allowed)
        });
    Arc::new(AuthorizationApplication::new(Arc::new(workflow)))
}

fn validator(user_id: Uuid) -> Arc<dyn TokenValidator> {
    Arc::new(TestTokenValidator { user_id })
}

fn configure(config: &mut web::ServiceConfig, validator: Arc<dyn TokenValidator>) {
    config.service(
        web::scope("/api")
            .wrap(JwtAuthentication::new(validator))
            .service(
                web::resource("/organizations/{organization_id}")
                    .wrap(AuthorizationGuard::organization(
                        "organization.read",
                        "organization_id",
                    ))
                    .route(web::get().to(ok)),
            ),
    );
}

#[actix_web::test]
async fn route_guard_allows_authenticated_user_with_permission() {
    let user_id = Uuid::new_v4();
    let org_id = Uuid::new_v4();
    let auth = authorization(true, user_id, org_id);
    let token_validator = validator(user_id);
    let app = test::init_service(
        App::new()
            .app_data(web::Data::from(auth))
            .configure(move |cfg| configure(cfg, token_validator)),
    )
    .await;
    let request = test::TestRequest::get()
        .uri(&format!("/api/organizations/{org_id}"))
        .insert_header(("Authorization", "Bearer valid-test-token"))
        .to_request();
    let response = test::call_service(&app, request).await;
    assert_eq!(response.status(), StatusCode::OK);
}

#[actix_web::test]
async fn route_guard_rejects_user_without_permission() {
    let user_id = Uuid::new_v4();
    let org_id = Uuid::new_v4();
    let auth = authorization(false, user_id, org_id);
    let token_validator = validator(user_id);
    let app = test::init_service(
        App::new()
            .app_data(web::Data::from(auth))
            .configure(move |cfg| configure(cfg, token_validator)),
    )
    .await;
    let request = test::TestRequest::get()
        .uri(&format!("/api/organizations/{org_id}"))
        .insert_header(("Authorization", "Bearer valid-test-token"))
        .to_request();
    let error = test::try_call_service(&app, request).await.unwrap_err();
    assert_eq!(
        error.as_response_error().status_code(),
        StatusCode::FORBIDDEN
    );
}

#[actix_web::test]
async fn jwt_middleware_rejects_missing_bearer_token() {
    let user_id = Uuid::new_v4();
    let org_id = Uuid::new_v4();
    let auth = authorization(true, user_id, org_id);
    let token_validator = validator(user_id);
    let app = test::init_service(
        App::new()
            .app_data(web::Data::from(auth))
            .configure(move |cfg| configure(cfg, token_validator)),
    )
    .await;
    let request = test::TestRequest::get()
        .uri(&format!("/api/organizations/{org_id}"))
        .to_request();
    let error = test::try_call_service(&app, request).await.unwrap_err();
    assert_eq!(
        error.as_response_error().status_code(),
        StatusCode::UNAUTHORIZED
    );
}
