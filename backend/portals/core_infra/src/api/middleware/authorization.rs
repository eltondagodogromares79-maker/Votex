use crate::{
    application::ports::security::{AuthorizationFailure, PermissionAuthorizer},
    domain::security::{AuthenticatedUser, AuthorizationScope},
};
use actix_web::{
    Error, HttpMessage,
    dev::{Service, ServiceRequest, ServiceResponse, Transform},
    error::{ErrorBadRequest, ErrorForbidden, ErrorInternalServerError, ErrorUnauthorized},
    web,
};
use futures_util::future::LocalBoxFuture;
use std::{
    future::{Ready, ready},
    rc::Rc,
    task::{Context, Poll},
};
use uuid::Uuid;

pub struct AuthorizationGuard {
    scope: GuardScope,
    permission: &'static str,
}
#[derive(Clone)]
enum GuardScope {
    System,
    Organization(&'static str),
    Pageant(&'static str),
}
impl AuthorizationGuard {
    pub fn system(permission: &'static str) -> Self {
        Self {
            scope: GuardScope::System,
            permission,
        }
    }
    pub fn organization(permission: &'static str, param: &'static str) -> Self {
        Self {
            scope: GuardScope::Organization(param),
            permission,
        }
    }
    pub fn pageant(permission: &'static str, param: &'static str) -> Self {
        Self {
            scope: GuardScope::Pageant(param),
            permission,
        }
    }
}
impl<S, B> Transform<S, ServiceRequest> for AuthorizationGuard
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type InitError = ();
    type Transform = AuthorizationGuardService<S>;
    type Future = Ready<Result<Self::Transform, ()>>;
    fn new_transform(&self, service: S) -> Self::Future {
        ready(Ok(AuthorizationGuardService {
            service: Rc::new(service),
            scope: self.scope.clone(),
            permission: self.permission,
        }))
    }
}
pub struct AuthorizationGuardService<S> {
    service: Rc<S>,
    scope: GuardScope,
    permission: &'static str,
}
impl<S, B> Service<ServiceRequest> for AuthorizationGuardService<S>
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
        let scope = self.scope.clone();
        let permission = self.permission;
        Box::pin(async move {
            let user = req
                .extensions()
                .get::<AuthenticatedUser>()
                .cloned()
                .ok_or_else(|| ErrorUnauthorized("Unauthorized"))?;
            let authorizer = req
                .app_data::<web::Data<dyn PermissionAuthorizer>>()
                .cloned()
                .ok_or_else(|| ErrorInternalServerError("Authorization is not configured"))?;
            let scope = match scope {
                GuardScope::System => AuthorizationScope::System,
                GuardScope::Organization(key) => AuthorizationScope::Organization {
                    organization_id: parse_scope_id(req.match_info().get(key))?,
                },
                GuardScope::Pageant(key) => AuthorizationScope::Pageant {
                    pageant_id: parse_scope_id(req.match_info().get(key))?,
                },
            };
            authorizer
                .authorize(user.user_id, scope, permission)
                .await
                .map_err(|error| match error {
                    AuthorizationFailure::Forbidden => ErrorForbidden("Forbidden"),
                    AuthorizationFailure::Internal => {
                        ErrorInternalServerError("Authorization failed")
                    }
                })?;
            service.call(req).await
        })
    }
}
fn parse_scope_id(value: Option<&str>) -> Result<Uuid, Error> {
    value
        .and_then(|v| Uuid::parse_str(v).ok())
        .ok_or_else(|| ErrorBadRequest("Invalid authorization scope id"))
}
