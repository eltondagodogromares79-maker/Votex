use crate::application::legal_policies::LegalPolicyApplication;
use actix_web::{HttpMessage, HttpRequest, HttpResponse, web};
use core_auth::domain::models::authenticated_user::AuthenticatedUser;
use core_infra::AppError;
use serde::Deserialize;
use uuid::Uuid;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateLegalPolicy {
    title: String,
    intro: String,
    body: String,
}

fn user_id(request: &HttpRequest) -> Result<Uuid, AppError> {
    request
        .extensions()
        .get::<AuthenticatedUser>()
        .map(|user| user.user_id)
        .ok_or(AppError::Unauthorized)
}

pub async fn list(app: web::Data<LegalPolicyApplication>) -> Result<HttpResponse, AppError> {
    Ok(HttpResponse::Ok().json(app.list().await?))
}

pub async fn update(
    request: HttpRequest,
    app: web::Data<LegalPolicyApplication>,
    slug: web::Path<String>,
    body: web::Json<UpdateLegalPolicy>,
) -> Result<HttpResponse, AppError> {
    let policy = app
        .update(
            &slug,
            &body.title,
            &body.intro,
            &body.body,
            user_id(&request)?,
        )
        .await?;
    Ok(HttpResponse::Ok().json(policy))
}
