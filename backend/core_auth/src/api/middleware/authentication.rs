use async_trait::async_trait;
use std::{
    future::{Ready, ready},
    rc::Rc,
    sync::Arc,
    task::{Context, Poll},
};

use actix_web::{
    Error, HttpMessage,
    dev::{Service, ServiceRequest, ServiceResponse, Transform},
    error::ErrorUnauthorized,
};
use futures_util::future::LocalBoxFuture;

use crate::{
    application::ports::token_validator::TokenValidator,
    domain::models::authenticated_user::AuthenticatedUser,
};

pub struct JwtAuthentication {
    token_validator: Arc<dyn TokenValidator>,
}

/// Adapter that exposes core_auth's JWT validator through core_infra's reusable middleware port.
pub struct CoreAuthTokenAuthenticator {
    validator: Arc<dyn TokenValidator>,
}
impl CoreAuthTokenAuthenticator {
    pub fn new(validator: Arc<dyn TokenValidator>) -> Self {
        Self { validator }
    }
}
#[async_trait]
impl core_infra::application::ports::security::TokenAuthenticator for CoreAuthTokenAuthenticator {
    async fn authenticate(&self, token: &str) -> Result<AuthenticatedUser, ()> {
        self.validator
            .validate_access_token(token)
            .await
            .map_err(|_| ())
    }
}

impl JwtAuthentication {
    pub fn new(token_validator: Arc<dyn TokenValidator>) -> Self {
        Self { token_validator }
    }
}

impl<S, B> Transform<S, ServiceRequest> for JwtAuthentication
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type InitError = ();
    type Transform = JwtAuthenticationMiddleware<S>;
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ready(Ok(JwtAuthenticationMiddleware {
            service: Rc::new(service),
            token_validator: self.token_validator.clone(),
        }))
    }
}

pub struct JwtAuthenticationMiddleware<S> {
    service: Rc<S>,
    token_validator: Arc<dyn TokenValidator>,
}

impl<S, B> Service<ServiceRequest> for JwtAuthenticationMiddleware<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Future = LocalBoxFuture<'static, Result<Self::Response, Self::Error>>;

    fn poll_ready(&self, context: &mut Context<'_>) -> Poll<Result<(), Self::Error>> {
        self.service.poll_ready(context)
    }

    fn call(&self, request: ServiceRequest) -> Self::Future {
        let service = self.service.clone();
        let token_validator = self.token_validator.clone();

        let authorization = request
            .headers()
            .get("Authorization")
            .and_then(|value| value.to_str().ok())
            .map(str::to_owned);

        Box::pin(async move {
            let authorization = authorization.ok_or_else(|| ErrorUnauthorized("Unauthorized"))?;

            let token = authorization
                .strip_prefix("Bearer ")
                .ok_or_else(|| ErrorUnauthorized("Unauthorized"))?;

            if token.is_empty() {
                return Err(ErrorUnauthorized("Unauthorized"));
            }

            let authenticated_user = token_validator
                .validate_access_token(token)
                .await
                .map_err(|_| ErrorUnauthorized("Unauthorized"))?;

            request
                .extensions_mut()
                .insert::<AuthenticatedUser>(authenticated_user);

            let response = service.call(request).await?;

            Ok(response)
        })
    }
}
