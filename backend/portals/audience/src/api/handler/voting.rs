use crate::{
    application::voting::VotingApplication,
    contracts::voting::{
        StartVoteRequest, VoteCandidateResponse, VoteCheckoutResponse, VotePackageResponse,
    },
};
use actix_web::{HttpMessage, HttpRequest, HttpResponse, web};
use core_auth::domain::models::authenticated_user::AuthenticatedUser;
use core_infra::AppError;
use uuid::Uuid;
use validator::Validate;
#[derive(serde::Deserialize)]
pub struct PageantPath {
    pageant_id: Uuid,
}
fn user(req: &HttpRequest) -> Result<Uuid, AppError> {
    req.extensions()
        .get::<AuthenticatedUser>()
        .map(|u| u.user_id)
        .ok_or(AppError::Unauthorized)
}
pub async fn packages(
    app: web::Data<VotingApplication>,
    path: web::Path<PageantPath>,
) -> Result<HttpResponse, AppError> {
    Ok(HttpResponse::Ok().json(
        app.packages(path.pageant_id)
            .await?
            .into_iter()
            .map(VotePackageResponse)
            .collect::<Vec<_>>(),
    ))
}
pub async fn candidates(
    app: web::Data<VotingApplication>,
    path: web::Path<PageantPath>,
) -> Result<HttpResponse, AppError> {
    Ok(HttpResponse::Ok().json(
        app.candidates(path.pageant_id)
            .await?
            .into_iter()
            .map(VoteCandidateResponse)
            .collect::<Vec<_>>(),
    ))
}
pub async fn start(
    req: HttpRequest,
    app: web::Data<VotingApplication>,
    body: web::Json<StartVoteRequest>,
    path: web::Path<PageantPath>,
) -> Result<HttpResponse, AppError> {
    body.validate()?;
    let key = req
        .headers()
        .get("Idempotency-Key")
        .and_then(|v| v.to_str().ok())
        .ok_or_else(|| AppError::BadRequest("Idempotency-Key header is required".into()))?;
    let body = body.into_inner();
    let result = app
        .start_vote(
            user(&req)?,
            path.pageant_id,
            body.contestant_id,
            body.package_id,
            key,
        )
        .await?;
    Ok(HttpResponse::Created().json(VoteCheckoutResponse(result)))
}
#[derive(serde::Deserialize)]
pub struct VotePath {
    vote_id: Uuid,
}
pub async fn status(
    req: HttpRequest,
    app: web::Data<VotingApplication>,
    path: web::Path<VotePath>,
) -> Result<HttpResponse, AppError> {
    Ok(HttpResponse::Ok().json(VoteCheckoutResponse(
        app.status(user(&req)?, path.vote_id).await?,
    )))
}
