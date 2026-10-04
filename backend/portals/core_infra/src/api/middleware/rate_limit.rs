use crate::{
    application::ports::rate_limit_store::RateLimitStore, contracts::rate_limit::RateLimitConfig,
    infrastructure::in_memory_rate_limit_store::InMemoryRateLimitStore,
};
use actix_web::{
    Error, HttpResponse,
    body::EitherBody,
    dev::{Service, ServiceRequest, ServiceResponse, Transform},
    http::header,
};
use futures_util::future::LocalBoxFuture;
use std::{
    future::{Ready, ready},
    net::SocketAddr,
    rc::Rc,
    sync::Arc,
    task::{Context, Poll},
    time::Instant,
};
#[derive(Clone)]
pub struct RateLimitMiddleware {
    config: RateLimitConfig,
    store: Arc<dyn RateLimitStore>,
}
impl RateLimitMiddleware {
    pub fn new(config: RateLimitConfig) -> Self {
        Self {
            config,
            store: Arc::new(InMemoryRateLimitStore::default()),
        }
    }
    pub fn with_store(config: RateLimitConfig, store: Arc<dyn RateLimitStore>) -> Self {
        Self { config, store }
    }
}
impl<S, B> Transform<S, ServiceRequest> for RateLimitMiddleware
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    B: 'static,
{
    type Response = ServiceResponse<EitherBody<B>>;
    type Error = Error;
    type InitError = ();
    type Transform = RateLimitService<S>;
    type Future = Ready<Result<Self::Transform, ()>>;
    fn new_transform(&self, service: S) -> Self::Future {
        ready(Ok(RateLimitService {
            service: Rc::new(service),
            config: self.config,
            store: self.store.clone(),
        }))
    }
}
pub struct RateLimitService<S> {
    service: Rc<S>,
    config: RateLimitConfig,
    store: Arc<dyn RateLimitStore>,
}
impl<S, B> Service<ServiceRequest> for RateLimitService<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    B: 'static,
{
    type Response = ServiceResponse<EitherBody<B>>;
    type Error = Error;
    type Future = LocalBoxFuture<'static, Result<Self::Response, Error>>;
    fn poll_ready(&self, cx: &mut Context<'_>) -> Poll<Result<(), Error>> {
        self.service.poll_ready(cx)
    }
    fn call(&self, req: ServiceRequest) -> Self::Future {
        let key = req
            .peer_addr()
            .map(|addr: SocketAddr| addr.ip().to_string())
            .unwrap_or_else(|| "unknown-peer".to_owned());
        let window = self.config.window;
        let exceeded = !self
            .store
            .allow(&key, self.config.max_requests, window, Instant::now());
        if exceeded {
            let retry = window.as_secs().max(1).to_string();
            let response = HttpResponse::TooManyRequests()
                .insert_header((header::RETRY_AFTER, retry))
                .finish();
            return Box::pin(async move { Ok(req.into_response(response).map_into_right_body()) });
        }
        let service = self.service.clone();
        Box::pin(async move {
            service
                .call(req)
                .await
                .map(ServiceResponse::map_into_left_body)
        })
    }
}
