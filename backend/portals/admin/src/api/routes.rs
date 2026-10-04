use std::sync::Arc;

use actix_web::web;
use core_infra::{
    api::middleware::{AuthorizationGuard, JwtAuthentication},
    application::ports::security::TokenAuthenticator,
};

use crate::api::handler::{
    activity_logs::{get_audit_log, get_transaction_log, list_audit_logs, list_transaction_logs},
    directory::{get_organization, get_pageant, get_user, list_organizations, list_pageants, list_users},
    revenue::report as revenue_report,
    subscription_plans::{create, deactivate, get, list, update},
};

/// Register platform-admin endpoints behind JWT authentication and system RBAC.
pub fn configure(config: &mut web::ServiceConfig, token_validator: Arc<dyn TokenAuthenticator>) {
    config.service(
        web::scope("/api/v1/admin")
            .wrap(JwtAuthentication::new(token_validator))
            .service(
                web::resource("/users")
                    .wrap(AuthorizationGuard::system("user.read"))
                    .route(web::get().to(list_users)),
            )
            .service(
                web::resource("/users/{id}")
                    .wrap(AuthorizationGuard::system("user.read"))
                    .route(web::get().to(get_user)),
            )
            .service(
                web::resource("/organizations")
                    .wrap(AuthorizationGuard::system("organization.read"))
                    .route(web::get().to(list_organizations)),
            )
            .service(
                web::resource("/organizations/{id}")
                    .wrap(AuthorizationGuard::system("organization.read"))
                    .route(web::get().to(get_organization)),
            )
            .service(
                web::resource("/pageants")
                    .wrap(AuthorizationGuard::system("pageant.read"))
                    .route(web::get().to(list_pageants)),
            )
            .service(
                web::resource("/pageants/{id}")
                    .wrap(AuthorizationGuard::system("pageant.read"))
                    .route(web::get().to(get_pageant)),
            )
            .service(
                web::resource("/subscription-plans")
                    .wrap(AuthorizationGuard::system("billing.manage"))
                    .route(web::get().to(list))
                    .route(web::post().to(create)),
            )
            .service(
                web::resource("/revenue")
                    .wrap(AuthorizationGuard::system("billing.read"))
                    .route(web::get().to(revenue_report)),
            )
            .service(
                web::resource("/audit-logs")
                    .wrap(AuthorizationGuard::system("audit.read"))
                    .route(web::get().to(list_audit_logs)),
            )
            .service(
                web::resource("/audit-logs/{id}")
                    .wrap(AuthorizationGuard::system("audit.read"))
                    .route(web::get().to(get_audit_log)),
            )
            .service(
                web::resource("/transaction-logs")
                    .wrap(AuthorizationGuard::system("transaction.read"))
                    .route(web::get().to(list_transaction_logs)),
            )
            .service(
                web::resource("/transaction-logs/{id}")
                    .wrap(AuthorizationGuard::system("transaction.read"))
                    .route(web::get().to(get_transaction_log)),
            )
            .service(
                web::resource("/subscription-plans/{id}")
                    .wrap(AuthorizationGuard::system("billing.manage"))
                    .route(web::get().to(get))
                    .route(web::put().to(update))
                    .route(web::delete().to(deactivate)),
            ),
    );
}
