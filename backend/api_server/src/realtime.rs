use actix_web::{
    HttpMessage, HttpRequest, HttpResponse,
    error::{ErrorForbidden, ErrorInternalServerError, ErrorUnauthorized},
    http::header,
    web,
};
use actix_ws::Message;
use core_auth::domain::models::authenticated_user::AuthenticatedUser;
use core_infra::{
    RealtimeHub, api::middleware::JwtAuthentication,
    application::ports::security::TokenAuthenticator, db::with_request_database_context,
    infrastructure::postgres::realtime_workflow::can_access_pageant,
};
use futures_util::StreamExt;
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use std::sync::Arc;
use uuid::Uuid;

pub fn configure(
    config: &mut web::ServiceConfig,
    token_authenticator: Arc<dyn TokenAuthenticator>,
) {
    config.service(
        web::scope("/api/v1/realtime")
            .service(
                web::resource("/ticket")
                    .wrap(JwtAuthentication::new(token_authenticator))
                    .route(web::post().to(issue_ticket)),
            )
            .route("/pageants", web::get().to(connect_pageant)),
    );
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct TicketResponse {
    ticket: Uuid,
}

async fn issue_ticket(
    request: HttpRequest,
    hub: web::Data<RealtimeHub>,
) -> Result<HttpResponse, actix_web::Error> {
    let user = request
        .extensions()
        .get::<AuthenticatedUser>()
        .cloned()
        .ok_or_else(|| ErrorUnauthorized("Unauthorized"))?;
    Ok(HttpResponse::Ok().json(TicketResponse {
        ticket: hub.issue_ticket(user),
    }))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct PageantSocketQuery {
    pageant_id: Uuid,
    ticket: Uuid,
}

async fn connect_pageant(
    request: HttpRequest,
    body: web::Payload,
    query: web::Query<PageantSocketQuery>,
    hub: web::Data<RealtimeHub>,
    pool: web::Data<PgPool>,
    frontend_origins: web::Data<Vec<String>>,
) -> Result<HttpResponse, actix_web::Error> {
    let request_origin = request
        .headers()
        .get(header::ORIGIN)
        .and_then(|value| value.to_str().ok());
    if !frontend_origins
        .iter()
        .any(|origin| request_origin == Some(origin.as_str()))
    {
        return Err(ErrorForbidden("WebSocket origin is not allowed"));
    }
    let user = hub
        .consume_ticket(query.ticket)
        .ok_or_else(|| ErrorUnauthorized("Invalid or expired ticket"))?;
    let allowed = with_request_database_context(
        Some(user.clone()),
        can_access_pageant(pool.get_ref(), user.user_id, &user.role, query.pageant_id),
    )
    .await
    .map_err(ErrorInternalServerError)?;
    if !allowed {
        return Err(ErrorForbidden("No access to this pageant"));
    }

    let (response, mut session, mut incoming) = actix_ws::handle(&request, body)?;
    let mut events = hub.subscribe();
    let pageant_id = query.pageant_id;
    let connection_user = user.clone();
    let pool = pool.get_ref().clone();
    actix_web::rt::spawn(async move {
        loop {
            tokio::select! {
                message = incoming.next() => match message {
                    Some(Ok(Message::Ping(bytes))) => { if session.pong(&bytes).await.is_err() { break; } },
                    Some(Ok(Message::Close(reason))) => { let _ = session.close(reason).await; break; },
                    Some(Ok(_)) => {},
                    Some(Err(_)) | None => break,
                },
                event = events.recv() => match event {
                    Ok(event) if event.pageant_id == pageant_id => {
                        // Recheck every event so a deactivated or removed staff
                        // assignment stops receiving pageant activity promptly.
                        match with_request_database_context(
                            Some(connection_user.clone()),
                            can_access_pageant(&pool, connection_user.user_id, &connection_user.role, pageant_id),
                        ).await {
                            Ok(true) => {},
                            _ => { let _ = session.close(None).await; break; }
                        }
                        let Ok(json) = serde_json::to_string(&event) else { continue };
                        if session.text(json).await.is_err() { break; }
                    },
                    Ok(_) | Err(tokio::sync::broadcast::error::RecvError::Lagged(_)) => {},
                    Err(tokio::sync::broadcast::error::RecvError::Closed) => break,
                }
            }
        }
    });
    Ok(response)
}

/// Convert successful portal writes into low-detail invalidation events. The
/// browser refetches the normal authenticated API; no scoring data is pushed
/// through this channel.
pub fn event_for_request(method: &str, path: &str) -> Option<(Uuid, &'static str)> {
    if !matches!(method, "POST" | "PUT" | "PATCH" | "DELETE") {
        return None;
    }

    if let Some(rest) = path.strip_prefix("/api/v1/judge/pageants/") {
        let pageant_id = Uuid::parse_str(rest.split('/').next()?).ok()?;
        return Some((pageant_id, "scores.updated"));
    }
    if let Some(rest) = path.strip_prefix("/api/v1/coordinator/pageants/") {
        let pageant_id = Uuid::parse_str(rest.split('/').next()?).ok()?;
        return Some((pageant_id, "pageant.changed"));
    }
    if let Some(rest) = path.strip_prefix("/api/v1/organizations/") {
        let mut segments = rest.split('/');
        let _organization_id = segments.next()?;
        if segments.next()? != "pageants" {
            return None;
        }
        let pageant_id = Uuid::parse_str(segments.next()?).ok()?;
        return Some((pageant_id, "pageant.changed"));
    }
    None
}
