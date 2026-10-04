use actix_web::{HttpMessage, HttpRequest, HttpResponse, web};

use uuid::Uuid;

use crate::domain::models::authenticated_user::AuthenticatedUser;

pub async fn test_authorization(
    request: HttpRequest,
    organization_id: web::Path<Uuid>,
) -> actix_web::Result<HttpResponse> {
    // ------------------------------------------------------------
    // Get authenticated user from request extensions.
    // ------------------------------------------------------------

    let authenticated_user = request
        .extensions()
        .get::<AuthenticatedUser>()
        .cloned()
        .ok_or_else(|| actix_web::error::ErrorUnauthorized("Unauthorized"))?;

    let organization_id = organization_id.into_inner();

    // ------------------------------------------------------------
    // Authorization succeeded.
    // ------------------------------------------------------------

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "message": "Authorization successful",
        "user_id": authenticated_user.user_id,
        "organization_id": organization_id,
        "permission": "organization.read"
    })))
}

pub async fn test_pageant_authorization(
    request: HttpRequest,
    pageant_id: web::Path<Uuid>,
) -> actix_web::Result<HttpResponse> {
    let user = request
        .extensions()
        .get::<AuthenticatedUser>()
        .cloned()
        .ok_or_else(|| actix_web::error::ErrorUnauthorized("Unauthorized"))?;
    Ok(HttpResponse::Ok().json(serde_json::json!({
        "message": "Authorization successful",
        "user_id": user.user_id,
        "pageant_id": pageant_id.into_inner(),
        "permission": "score.submit"
    })))
}

pub async fn test_system_authorization(request: HttpRequest) -> actix_web::Result<HttpResponse> {
    let user = request
        .extensions()
        .get::<AuthenticatedUser>()
        .cloned()
        .ok_or_else(|| actix_web::error::ErrorUnauthorized("Unauthorized"))?;
    Ok(HttpResponse::Ok().json(serde_json::json!({
        "message": "Authorization successful",
        "user_id": user.user_id,
        "permission": "audit.read"
    })))
}
