use crate::{
    application::ports::security::TokenAuthenticator, db::with_request_database_context,
    domain::security::AuthenticatedUser,
};
use actix_web::{
    Error, HttpMessage,
    dev::{Service, ServiceRequest, ServiceResponse, Transform},
    error::ErrorUnauthorized,
};
use futures_util::future::LocalBoxFuture;
use std::{
    future::{Ready, ready},
    rc::Rc,
    sync::Arc,
    task::{Context, Poll},
};

pub struct JwtAuthentication {
    authenticator: Arc<dyn TokenAuthenticator>,
}
impl JwtAuthentication {
    pub fn new(authenticator: Arc<dyn TokenAuthenticator>) -> Self {
        Self { authenticator }
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
    type Transform = JwtAuthenticationService<S>;
    type Future = Ready<Result<Self::Transform, ()>>;
    fn new_transform(&self, service: S) -> Self::Future {
        ready(Ok(JwtAuthenticationService {
            service: Rc::new(service),
            authenticator: self.authenticator.clone(),
        }))
    }
}
pub struct JwtAuthenticationService<S> {
    service: Rc<S>,
    authenticator: Arc<dyn TokenAuthenticator>,
}
impl<S, B> Service<ServiceRequest> for JwtAuthenticationService<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Future = LocalBoxFuture<'static, Result<Self::Response, Error>>;
    fn poll_ready(&self, cx: &mut Context<'_>) -> Poll<Result<(), Error>> {
        self.service.poll_ready(cx)
    }
    fn call(&self, req: ServiceRequest) -> Self::Future {
        let service = self.service.clone();
        let authenticator = self.authenticator.clone();
        let value = req
            .headers()
            .get("Authorization")
            .and_then(|v| v.to_str().ok())
            .map(str::to_owned);
        Box::pin(async move {
            let bearer = value.ok_or_else(|| ErrorUnauthorized("Unauthorized"))?;
            let token = bearer
                .strip_prefix("Bearer ")
                .filter(|token| !token.is_empty())
                .ok_or_else(|| ErrorUnauthorized("Unauthorized"))?;
            let user: AuthenticatedUser = authenticator
                .authenticate(token)
                .await
                .map_err(|_| ErrorUnauthorized("Unauthorized"))?;
            req.extensions_mut().insert(user.clone());
            with_request_database_context(Some(user), async move { service.call(req).await }).await
        })
    }
}
