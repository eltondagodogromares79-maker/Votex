use crate::api::handler::judges::{
    categories, category_scoring, contestants, criteria, finalize_category_scores, pageants,
    rounds, submit_category_scores,
};
use actix_web::web;
use core_infra::{
    api::middleware::{AuthorizationGuard, JwtAuthentication},
    application::ports::security::TokenAuthenticator,
};
use std::sync::Arc;

/// Register judge read endpoints behind JWT authentication and pageant RBAC.
pub fn configure(cfg: &mut web::ServiceConfig, token: Arc<dyn TokenAuthenticator>) {
    cfg.service(
        web::scope("/api/v1/judge")
            .wrap(JwtAuthentication::new(token))
            .route("/pageants", web::get().to(pageants))
            .route(
                "/pageants/{pageant_id}/contestants",
                web::get()
                    .to(contestants)
                    .wrap(AuthorizationGuard::pageant("contestant.read", "pageant_id")),
            )
            .route(
                "/pageants/{pageant_id}/rounds",
                web::get()
                    .to(rounds)
                    .wrap(AuthorizationGuard::pageant("pageant.read", "pageant_id")),
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
                "/pageants/{pageant_id}/rounds/{round_id}/categories/{category_id}/scoring",
                web::get().to(category_scoring).wrap(AuthorizationGuard::pageant("score.submit", "pageant_id")),
            )
            .route(
                "/pageants/{pageant_id}/rounds/{round_id}/categories/{category_id}/contestants/{contestant_id}/scores",
                web::put().to(submit_category_scores).wrap(AuthorizationGuard::pageant("score.submit", "pageant_id")),
            )
            .route(
                "/pageants/{pageant_id}/rounds/{round_id}/categories/{category_id}/submit",
                web::post().to(finalize_category_scores).wrap(AuthorizationGuard::pageant("score.submit", "pageant_id")),
            ),
    );
}
