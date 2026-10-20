use actix_web::{App, HttpMessage, HttpServer, dev::Service, middleware::Logger, web};

use tracing::info;

use admin::domain::activity_logs::NewAuditLog;
use core_auth::api::middleware::authentication::CoreAuthTokenAuthenticator;
use core_infra::domain::security::AuthenticatedUser;
use core_infra::middleware::cors::configure;
use core_infra::{
    RealtimeHub, RequestIdMiddleware,
    api::middleware::{RateLimitConfig, RateLimitMiddleware},
    application::ports::security::{PermissionAuthorizer, TokenAuthenticator},
    config::ServerConfig,
    db::with_request_database_context,
};
use serde_json::json;
use uuid::Uuid;

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

    let activity_logs = dependencies.activity_logs.clone();
    let audit_pool = dependencies.pool.clone();
    let realtime_hub = std::sync::Arc::new(RealtimeHub::new());
    {
        let hub = realtime_hub.clone();
        let pool = dependencies.pool.clone();
        tokio::spawn(async move {
            loop {
                let mut listener = match sqlx::postgres::PgListener::connect_with(&pool).await {
                    Ok(listener) => listener,
                    Err(error) => {
                        tracing::warn!(%error, "realtime listener could not connect; retrying");
                        tokio::time::sleep(std::time::Duration::from_secs(2)).await;
                        continue;
                    }
                };
                if let Err(error) = listener.listen("votex_pageant_events").await {
                    tracing::warn!(%error, "realtime listener could not subscribe; retrying");
                    tokio::time::sleep(std::time::Duration::from_secs(2)).await;
                    continue;
                }
                loop {
                    match listener.recv().await {
                        Ok(notification) => {
                            if let Some((pageant_id, event)) =
                                notification.payload().split_once('|')
                            {
                                if let Ok(pageant_id) = Uuid::parse_str(pageant_id) {
                                    hub.publish_pageant(pageant_id, event);
                                }
                            }
                        }
                        Err(error) => {
                            tracing::warn!(%error, "realtime listener disconnected; reconnecting");
                            break;
                        }
                    }
                }
                tokio::time::sleep(std::time::Duration::from_secs(1)).await;
            }
        });
    }
    HttpServer::new(move || {
        let realtime_hub = realtime_hub.clone();
        App::new()
            // ====================================================
            // Middleware
            // ====================================================
            .wrap(configure(&cfg.frontend_url))
            .wrap(RequestIdMiddleware)
            .wrap(rate_limiter.clone())
            .wrap(Logger::default())
            .wrap_fn({
                let activity_logs = activity_logs.clone();
                let audit_pool = audit_pool.clone();
                move |request, service| {
                    let method = request.method().as_str().to_owned();
                    let path = request.path().to_owned();
                    let user_agent = request.headers().get("User-Agent")
                        .and_then(|value| value.to_str().ok()).map(str::to_owned);
                    let incoming_request_id = request.headers().get("x-request-id")
                        .and_then(|value| value.to_str().ok()).and_then(|value| Uuid::parse_str(value).ok());
                    let audit_target = organization_audit_target(&method, &path);
                    let future = service.call(request);
                    let activity_logs = activity_logs.clone();
                    let audit_pool = audit_pool.clone();
                    async move {
                        let response = future.await?;
                        if response.status().is_success() {
                            if let Some((pageant_id, event)) = crate::realtime::event_for_request(&method, &path) {
                                let payload = format!("{pageant_id}|{event}");
                                if let Err(error) = sqlx::query(
                                    "SELECT pg_notify('votex_pageant_events', $1)",
                                )
                                .bind(payload)
                                .execute(&audit_pool)
                                .await
                                {
                                    tracing::warn!(%error, %pageant_id, "could not publish pageant realtime event");
                                }
                            }
                        }
                        let request_id = response.headers().get("x-request-id")
                            .and_then(|value| value.to_str().ok()).and_then(|value| Uuid::parse_str(value).ok())
                            .or(incoming_request_id);
                        let actor = response.request().extensions().get::<AuthenticatedUser>().cloned();
                        let mut targets = audit_target.into_iter().collect::<Vec<_>>();
                        if method == "PUT" && path == "/api/v1/auth/me"
                            && actor.as_ref().is_some_and(|user| user.role == "org_owner")
                        {
                            if let Some(actor) = actor.as_ref() {
                                match with_request_database_context(
                                    Some(actor.clone()),
                                    sqlx::query_scalar::<_, Uuid>(
                                        "SELECT id FROM organizations WHERE owner_id = $1 AND is_active = TRUE",
                                    )
                                    .bind(actor.user_id)
                                    .fetch_all(&audit_pool),
                                )
                                .await
                                {
                                    Ok(organization_ids) => targets.extend(organization_ids.into_iter().map(|organization_id| (
                                        organization_id,
                                        None,
                                        None,
                                        "PROFILE_UPDATED".to_owned(),
                                        "profile".to_owned(),
                                    ))),
                                    Err(error) => tracing::error!(%error, "failed to resolve organization for profile activity log"),
                                }
                            }
                        }

                        if let Some(actor) = actor {
                            for (organization_id, pageant_id, resource_id, action, resource_type) in targets {
                                let status = response.status();
                                let entry = NewAuditLog {
                                    organization_id,
                                    pageant_id,
                                    actor_user_id: actor.user_id,
                                    action,
                                    resource_type,
                                    resource_id,
                                    after_data: json!({ "method": method, "endpoint": path, "status": status.as_u16() }),
                                    request_id,
                                    ip_address: None,
                                    user_agent: user_agent.clone(),
                                    success: status.is_success(),
                                    failure_reason: (!status.is_success()).then(|| format!("HTTP {}", status.as_u16())),
                                };
                                if let Err(error) = with_request_database_context(
                                    Some(actor.clone()),
                                    activity_logs.create_audit_log(entry),
                                ).await {
                                    tracing::error!(%error, "failed to persist organization activity log");
                                }
                            }
                        }
                        Ok(response)
                    }
                }
            })
            // ====================================================
            // Application services
            // ====================================================
            .app_data(web::Data::new(cfg.frontend_url.clone()))
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
            .app_data(web::Data::from(dependencies.organizations.clone()))
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
            .app_data(web::Data::from(dependencies.audience_public_catalog.clone()))
            .app_data(web::Data::from(dependencies.audience_transactions.clone()))
            .app_data(web::Data::from(dependencies.org_transactions.clone()))
            .app_data(web::Data::from(dependencies.payment_provider.clone()))
            .app_data(web::Data::from(dependencies.subscription_plans.clone()))
            .app_data(web::Data::from(dependencies.admin_directory.clone()))
            .app_data(web::Data::from(dependencies.revenue.clone()))
            .app_data(web::Data::from(dependencies.activity_logs.clone()))
            .app_data(web::Data::new(dependencies.pool.clone()))
            .app_data(web::Data::from(realtime_hub.clone()))
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
                    crate::realtime::configure(config, token_validator.clone());
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

fn organization_audit_target(
    method: &str,
    path: &str,
) -> Option<(Uuid, Option<Uuid>, Option<Uuid>, String, String)> {
    if !matches!(method, "POST" | "PUT" | "PATCH" | "DELETE") {
        return None;
    }
    let tail = path.strip_prefix("/api/v1/organizations/")?;
    let mut parts = tail.split('/');
    let organization_id = Uuid::parse_str(parts.next()?).ok()?;
    let segments = parts.collect::<Vec<_>>();

    let pageant_position = segments.iter().position(|segment| *segment == "pageants");
    let pageant_id = pageant_position
        .and_then(|position| segments.get(position + 1))
        .and_then(|value| Uuid::parse_str(value).ok());
    let resource_id = segments
        .iter()
        .rev()
        .find_map(|value| Uuid::parse_str(value).ok())
        .or(pageant_id)
        .or(Some(organization_id));
    let resource_type = if let Some(position) = pageant_position {
        if pageant_id.is_some() {
            segments
                .get(position + 2)
                .copied()
                .unwrap_or("pageants")
                .to_owned()
        } else {
            "pageants".to_owned()
        }
    } else {
        segments
            .first()
            .copied()
            .unwrap_or("organization")
            .to_owned()
    };
    let action = match (method, segments.as_slice()) {
        ("PUT" | "PATCH", []) => "ORGANIZATION_UPDATED".to_owned(),
        ("POST", ["pageants"]) => "PAGEANT_CREATED".to_owned(),
        ("PUT" | "PATCH", ["pageants", _]) => "PAGEANT_UPDATED".to_owned(),
        ("DELETE", ["pageants", _]) => "PAGEANT_ARCHIVED".to_owned(),
        ("POST", ["pageants", _, "restore"]) => "PAGEANT_RESTORED".to_owned(),
        ("POST", ["pageants", _, "judges"]) => "JUDGE_ASSIGNED".to_owned(),
        ("DELETE", ["pageants", _, "judges", _]) => "JUDGE_REMOVED".to_owned(),
        ("POST", ["pageants", _, "tabulators"]) => "TABULATOR_ASSIGNED".to_owned(),
        ("DELETE", ["pageants", _, "tabulators", _]) => "TABULATOR_REMOVED".to_owned(),
        ("POST", ["pageants", _, "coordinators"]) => "PAGEANT_COORDINATOR_ASSIGNED".to_owned(),
        ("DELETE", ["pageants", _, "coordinators", _]) => "PAGEANT_COORDINATOR_REMOVED".to_owned(),
        ("POST", ["subscriptions"]) => "SUBSCRIPTION_REQUESTED".to_owned(),
        ("DELETE", ["subscriptions", _]) => "SUBSCRIPTION_CANCELED".to_owned(),
        ("POST", ["subscriptions", _, "payment-proof"]) => "PAYMENT_PROOF_SUBMITTED".to_owned(),
        ("POST", ["coordinators"]) => "ORGANIZATION_COORDINATOR_ADDED".to_owned(),
        ("PUT" | "PATCH", ["coordinators", _]) => "ORGANIZATION_COORDINATOR_UPDATED".to_owned(),
        ("DELETE", ["coordinators", _]) => "ORGANIZATION_COORDINATOR_REMOVED".to_owned(),
        ("POST", ["pageants", _, "vote-packages"]) => "VOTE_PACKAGE_CREATED".to_owned(),
        ("POST", ["pageants", _, "vote-packages", _, "activate"]) => {
            "VOTE_PACKAGE_ACTIVATED".to_owned()
        }
        ("PUT" | "PATCH", ["pageants", _, "vote-packages", _]) => "VOTE_PACKAGE_UPDATED".to_owned(),
        ("DELETE", ["pageants", _, "vote-packages", _]) => "VOTE_PACKAGE_DEACTIVATED".to_owned(),
        _ => {
            let verb = match method {
                "POST" => "CREATED_OR_SUBMITTED",
                "PUT" | "PATCH" => "UPDATED",
                "DELETE" => "DELETED_OR_CANCELLED",
                _ => unreachable!(),
            };
            format!("{}_{}", resource_type.to_ascii_uppercase(), verb)
        }
    };
    Some((
        organization_id,
        pageant_id,
        resource_id,
        action,
        resource_type,
    ))
}
