use crate::api::handler::public_catalog::{
    pageant as public_pageant, pageants as public_pageants, plans as public_plans,
};
use crate::api::handler::legal_policies::get as public_legal_policy;
use crate::api::handler::transactions::history as transaction_history;
use crate::api::handler::voting::{candidates, packages, start, status};
use actix_web::web;
use core_infra::{
    api::middleware::JwtAuthentication, application::ports::security::TokenAuthenticator,
};
use std::sync::Arc;
pub fn configure(cfg: &mut web::ServiceConfig, token: Arc<dyn TokenAuthenticator>) {
    // Public catalog endpoints are intentionally unauthenticated. They remain
    // covered by the API server's global rate-limit middleware.
    cfg.service(
        web::scope("/api/v1/audience/public")
            .route("/pageants", web::get().to(public_pageants))
            .route("/pageants/{slug}", web::get().to(public_pageant))
            .route("/subscription-plans", web::get().to(public_plans))
            .route("/legal-policies/{slug}", web::get().to(public_legal_policy)),
    );
    cfg.service(
        web::scope("/api/v1/audience")
            .wrap(JwtAuthentication::new(token))
            .route(
                "/pageants/{pageant_id}/vote-packages",
                web::get().to(packages),
            )
            .route(
                "/pageants/{pageant_id}/contestants",
                web::get().to(candidates),
            )
            .route("/pageants/{pageant_id}/votes", web::post().to(start))
            .route("/votes/{vote_id}", web::get().to(status))
            .route("/transactions", web::get().to(transaction_history)),
    );
}
