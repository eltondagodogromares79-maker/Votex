use actix_web::{
    Error,
    dev::{Service, ServiceRequest, ServiceResponse, Transform, forward_ready},
    http::header::{HeaderName, HeaderValue},
};
use std::{
    future::{Future, Ready, ready},
    pin::Pin,
    rc::Rc,
};
use tracing::Span;
use uuid::Uuid;

pub const REQUEST_ID_HEADER: &str = "x-request-id";
/// Maximum length we accept from an incoming X-Request-ID to prevent abuse.
const MAX_INCOMING_ID_LEN: usize = 64;

/// Actix middleware that attaches a request ID to every request/response.
///
/// - If the client sends `X-Request-ID` and it is ≤ 64 ASCII chars, we reuse it.
/// - Otherwise we generate a fresh UUID v4.
/// - The final ID is echoed back in the response `X-Request-ID` header.
/// - The ID is recorded in the current tracing span as `request_id`.
pub struct RequestIdMiddleware;

impl<S, B> Transform<S, ServiceRequest> for RequestIdMiddleware
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Transform = RequestIdMiddlewareService<S>;
    type InitError = ();
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ready(Ok(RequestIdMiddlewareService {
            service: Rc::new(service),
        }))
    }
}

pub struct RequestIdMiddlewareService<S> {
    service: Rc<S>,
}

impl<S, B> Service<ServiceRequest> for RequestIdMiddlewareService<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Future = Pin<Box<dyn Future<Output = Result<Self::Response, Self::Error>>>>;

    forward_ready!(service);

    fn call(&self, req: ServiceRequest) -> Self::Future {
        let svc = Rc::clone(&self.service);

        let request_id = resolve_request_id(&req);

        Box::pin(async move {
            // Record in the current tracing span so every log line in this
            // request carries the ID automatically.
            Span::current().record("request_id", &request_id.as_str());

            let mut res = svc.call(req).await?;

            // Echo the ID back to the client.
            if let Ok(value) = HeaderValue::from_str(&request_id) {
                res.headers_mut()
                    .insert(HeaderName::from_static(REQUEST_ID_HEADER), value);
            }

            Ok(res)
        })
    }
}

fn resolve_request_id(req: &ServiceRequest) -> String {
    req.headers()
        .get(REQUEST_ID_HEADER)
        .and_then(|v| v.to_str().ok())
        .filter(|s| {
            let len = s.len();
            // Accept only short, printable ASCII — reject anything suspicious.
            len > 0 && len <= MAX_INCOMING_ID_LEN && s.is_ascii()
        })
        .map(str::to_owned)
        .unwrap_or_else(|| Uuid::new_v4().to_string())
}
