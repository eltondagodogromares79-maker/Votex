use std::{
    future::{Ready, ready},
    rc::Rc,
    task::{Context, Poll},
};

use actix_web::{
    Error, HttpMessage,
    dev::{Service, ServiceRequest, ServiceResponse, Transform},
    error::{ErrorBadRequest, ErrorForbidden, ErrorInternalServerError, ErrorUnauthorized},
    web,
};
use futures_util::future::LocalBoxFuture;
use uuid::Uuid;

use crate::{
    application::{
        authorization::AuthorizationApplication, ports::authorization_workflow::AuthorizationScope,
    },
    domain::models::authenticated_user::AuthenticatedUser,
};

/// A route guard that checks one migration-defined permission against a scope.
/// For organization/pageant checks, `scope_id_param` names a UUID path parameter.
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

    pub fn organization(permission: &'static str, scope_id_param: &'static str) -> Self {
        Self {
            scope: GuardScope::Organization(scope_id_param),
            permission,
        }
    }

    pub fn pageant(permission: &'static str, scope_id_param: &'static str) -> Self {
        Self {
            scope: GuardScope::Pageant(scope_id_param),
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
    type Transform = AuthorizationGuardMiddleware<S>;
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ready(Ok(AuthorizationGuardMiddleware {
            service: Rc::new(service),
            scope: self.scope.clone(),
            permission: self.permission,
        }))
    }
}

pub struct AuthorizationGuardMiddleware<S> {
    service: Rc<S>,
    scope: GuardScope,
    permission: &'static str,
}

impl<S, B> Service<ServiceRequest> for AuthorizationGuardMiddleware<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Future = LocalBoxFuture<'static, Result<Self::Response, Self::Error>>;

    fn poll_ready(&self, cx: &mut Context<'_>) -> Poll<Result<(), Self::Error>> {
        self.service.poll_ready(cx)
    }

    fn call(&self, request: ServiceRequest) -> Self::Future {
        let service = self.service.clone();
        let scope = self.scope.clone();
        let permission = self.permission;

        Box::pin(async move {
            let user = request
                .extensions()
                .get::<AuthenticatedUser>()
                .cloned()
                .ok_or_else(|| ErrorUnauthorized("Unauthorized"))?;
            let authorization = request
                .app_data::<web::Data<AuthorizationApplication>>()
                .ok_or_else(|| ErrorInternalServerError("Authorization is not configured"))?;

            let scope = match scope {
                GuardScope::System => AuthorizationScope::System,
                GuardScope::Organization(param) => {
                    let id = parse_scope_id(request.match_info().get(param))?;
                    AuthorizationScope::Organization {
                        organization_id: id,
                    }
                }
                GuardScope::Pageant(param) => {
                    let id = parse_scope_id(request.match_info().get(param))?;
                    AuthorizationScope::Pageant { pageant_id: id }
                }
            };

            authorization
                .authorize(user.user_id, scope, permission)
                .await
                .map_err(|error| match error {
                    core_infra::AppError::Forbidden => ErrorForbidden("Forbidden"),
                    _ => ErrorInternalServerError("Authorization failed"),
                })?;

            service.call(request).await
        })
    }
}

fn parse_scope_id(value: Option<&str>) -> Result<Uuid, Error> {
    value
        .and_then(|value| Uuid::parse_str(value).ok())
        .ok_or_else(|| ErrorBadRequest("Invalid authorization scope id"))
}
