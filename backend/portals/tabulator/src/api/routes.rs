use crate::api::handler::tabulation::{
    advancements, categories, contestants, criteria, leaderboard, pageants, rounds,
};
use actix_web::web;
use core_infra::{
    api::middleware::{AuthorizationGuard, JwtAuthentication},
    application::ports::security::TokenAuthenticator,
};
use std::sync::Arc;

/// Register authenticated, pageant-scoped tabulator read endpoints.
pub fn configure(cfg: &mut web::ServiceConfig, token: Arc<dyn TokenAuthenticator>) {
    cfg.service(
        web::scope("/api/v1/tabulator")
            .wrap(JwtAuthentication::new(token))
            .route("/pageants", web::get().to(pageants))
            .route(
                "/pageants/{pageant_id}/contestants",
                web::get()
                    .to(contestants)
                    .wrap(AuthorizationGuard::pageant("contestant.read", "pageant_id")),
            )
            .route(
                "/pageants/{pageant_id}/categories",
                web::get()
                    .to(categories)
                    .wrap(AuthorizationGuard::pageant("pageant.read", "pageant_id")),
            )
            .route(
                "/pageants/{pageant_id}/criteria",
                web::get()
                    .to(criteria)
                    .wrap(AuthorizationGuard::pageant("pageant.read", "pageant_id")),
            )
            .route(
                "/pageants/{pageant_id}/rounds",
                web::get()
                    .to(rounds)
                    .wrap(AuthorizationGuard::pageant("pageant.read", "pageant_id")),
            )
            .route(
                "/pageants/{pageant_id}/rounds/{round_id}/advancements",
                web::get()
                    .to(advancements)
                    .wrap(AuthorizationGuard::pageant("pageant.read", "pageant_id")),
            )
            .route(
                "/pageants/{pageant_id}/rounds/{round_id}/leaderboard",
                web::get()
                    .to(leaderboard)
                    .wrap(AuthorizationGuard::pageant("pageant.read", "pageant_id")),
            ),
    );
}
