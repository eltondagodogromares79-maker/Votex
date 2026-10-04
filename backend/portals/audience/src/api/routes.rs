use crate::api::handler::transactions::history as transaction_history;
use crate::api::handler::voting::{candidates, packages, start, status};
use actix_web::web;
use core_infra::{
    api::middleware::JwtAuthentication, application::ports::security::TokenAuthenticator,
};
use std::sync::Arc;
pub fn configure(cfg: &mut web::ServiceConfig, token: Arc<dyn TokenAuthenticator>) {
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
