use actix_web::{App, HttpServer, middleware::Logger, web};

use tracing::info;

use core_auth::api::middleware::authentication::CoreAuthTokenAuthenticator;
use core_infra::{
    RequestIdMiddleware,
    api::middleware::{RateLimitConfig, RateLimitMiddleware, },
    application::ports::security::{PermissionAuthorizer, TokenAuthenticator},
    config::ServerConfig,
};
use core_infra::middleware::cors::configure;

use crate::{app, bootstrap::dependencies::ApplicationDependencies};

pub async fn run(cfg: ServerConfig, dependencies: ApplicationDependencies) -> std::io::Result<()> {
    let bind = cfg.bind_address();
    let token_authenticator: std::sync::Arc<dyn TokenAuthenticator> = std::sync::Arc::new(
        CoreAuthTokenAuthenticator::new(dependencies.token_validator.clone()),
    );
    let permission_authorizer: std::sync::Arc<dyn PermissionAuthorizer> =
        dependencies.authorization.clone();
    let rate_limiter = RateLimitMiddleware::new(RateLimitConfig::default());

    info!(
        address = %bind,
        "starting api server"
    );

    HttpServer::new(move || {
        App::new()
            // ====================================================
            // Middleware
            // ====================================================
            .wrap(configure(&cfg.frontend_url))
            .wrap(RequestIdMiddleware)
            .wrap(rate_limiter.clone())
            .wrap(Logger::default())
            // ====================================================
            // Application services
            // ====================================================
            .app_data(web::Data::from(dependencies.registration.clone()))
            .app_data(web::Data::from(dependencies.email_verification.clone()))
            .app_data(web::Data::from(dependencies.authentication.clone()))
            .app_data(web::Data::from(dependencies.refresh_token.clone()))
            .app_data(web::Data::from(dependencies.logout.clone()))
            .app_data(web::Data::from(dependencies.password_management.clone()))
            .app_data(web::Data::from(dependencies.profile.clone()))
            .app_data(web::Data::from(dependencies.authorization.clone()))
            .app_data(web::Data::from(permission_authorizer.clone()))
            .app_data(web::Data::from(dependencies.pageants.clone()))
            .app_data(web::Data::from(dependencies.coordinators.clone()))
            .app_data(web::Data::from(dependencies.vote_packages.clone()))
            .app_data(web::Data::from(dependencies.org_subscriptions.clone()))
            .app_data(web::Data::from(dependencies.org_vote_revenue.clone()))
            .app_data(web::Data::from(dependencies.pageant_staff.clone()))
            .app_data(web::Data::from(dependencies.coordinator_pageants.clone()))
            .app_data(web::Data::from(dependencies.coordinator_judges.clone()))
            .app_data(web::Data::from(
                dependencies.coordinator_contestants.clone(),
            ))
            .app_data(web::Data::from(
                dependencies.coordinator_pageant_setup.clone(),
            ))
            .app_data(web::Data::from(dependencies.coordinator_rounds.clone()))
            .app_data(web::Data::from(dependencies.judge.clone()))
            .app_data(web::Data::from(dependencies.tabulation.clone()))
            .app_data(web::Data::from(dependencies.audience_voting.clone()))
            .app_data(web::Data::from(dependencies.audience_transactions.clone()))
            .app_data(web::Data::from(dependencies.org_transactions.clone()))
            .app_data(web::Data::from(dependencies.payment_provider.clone()))
            .app_data(web::Data::from(dependencies.subscription_plans.clone()))
            .app_data(web::Data::from(dependencies.admin_directory.clone()))
            .app_data(web::Data::from(dependencies.revenue.clone()))
            .app_data(web::Data::from(dependencies.activity_logs.clone()))
            // ====================================================
            // HTTP configuration
            // ====================================================
            .app_data(web::Data::new(dependencies.auth_config.clone()))
            // ====================================================
            // Routes
            // ====================================================
            .configure({
                let token_validator = token_authenticator.clone();

                move |config| {
                    app::routes(config, token_validator.clone());
                    org_owner::configure(config, token_validator.clone());
                    admin::configure(config, token_validator.clone());
                    coordinator::configure(config, token_validator.clone());
                    judge::configure(config, token_validator.clone());
                    tabulator::configure(config, token_validator.clone());
                    audience::configure(config, token_validator.clone());
                    app::payment_routes(config);
                }
            })
    })
    .bind(&bind)?
    .run()
    .await
}
