use std::sync::Arc;

use actix_web::web;
use core_infra::application::ports::security::TokenAuthenticator;

/// Register all application routes.
pub fn routes(config: &mut web::ServiceConfig, token_validator: Arc<dyn TokenAuthenticator>) {
    core_auth::api::routes::auth::configure(config, token_validator);
}
