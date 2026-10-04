use std::sync::Arc;

use actix_web::web;
use core_infra::api::middleware::{AuthorizationGuard, JwtAuthentication};
use core_infra::application::ports::security::TokenAuthenticator;

use crate::api::handler::{
    change_password::change_password,
    email_verification::verify_email,
    login::login,
    logout::logout,
    me::{me, update_me},
    refresh_token::refresh_token,
    registration::{register_audience, register_organization_owner},
    test_authorization::{
        test_authorization, test_pageant_authorization, test_system_authorization,
    },
};

pub fn configure(config: &mut web::ServiceConfig, token_validator: Arc<dyn TokenAuthenticator>) {
    // ============================================================
    // Authentication routes
    // ============================================================

    config.service(
        web::scope("/api/v1/auth")
            .route("/register/audience", web::post().to(register_audience))
            .route(
                "/register/organization",
                web::post().to(register_organization_owner),
            )
            .route("/verify-email", web::post().to(verify_email))
            .route("/login", web::post().to(login))
            .route("/refresh", web::post().to(refresh_token))
            .route("/logout", web::post().to(logout))
            .service(
                web::scope("")
                    .wrap(JwtAuthentication::new(token_validator.clone()))
                    .route("/me", web::get().to(me))
                    .route("/me", web::put().to(update_me))
                    .route("/change-password", web::post().to(change_password)),
            ),
    );

    // ============================================================
    // Authorization test route
    //
    // Temporary endpoint used to verify:
    //
    // JWT
    //     ↓
    // JwtAuthentication
    //     ↓
    // AuthenticatedUser
    //     ↓
    // AuthorizationApplication
    //     ↓
    // AuthorizationWorkflow
    //     ↓
    // PostgreSQL
    // ============================================================

    config.service(
        web::scope("/api/v1/test")
            .wrap(JwtAuthentication::new(token_validator))
            .route(
                "/authorization/{organization_id}",
                web::get()
                    .to(test_authorization)
                    .wrap(AuthorizationGuard::organization(
                        "organization.read",
                        "organization_id",
                    )),
            )
            .route(
                "/pageant-authorization/{pageant_id}",
                web::get()
                    .to(test_pageant_authorization)
                    .wrap(AuthorizationGuard::pageant("score.submit", "pageant_id")),
            )
            .route(
                "/system-authorization",
                web::get()
                    .to(test_system_authorization)
                    .wrap(AuthorizationGuard::system("audit.read")),
            ),
    );
}
