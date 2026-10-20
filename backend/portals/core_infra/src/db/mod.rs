use std::time::Duration;

use futures_util::future::Future;
use sqlx::PgPool;
use sqlx::postgres::{PgConnectOptions, PgPoolOptions};
use tracing::info;
use uuid::Uuid;

use crate::{
    config::DatabaseConfig,
    domain::security::AuthenticatedUser,
    errors::AppError,
};

#[derive(Clone, Debug)]
struct RequestDatabaseContext {
    user_id: Uuid,
    role: String,
    is_system: bool,
}

tokio::task_local! {
    static REQUEST_DATABASE_CONTEXT: Option<RequestDatabaseContext>;
}

/// Run an authenticated request with database identity available to pool
/// connection hooks. A missing context always clears the PostgreSQL settings.
pub async fn with_request_database_context<F: Future>(
    user: Option<AuthenticatedUser>,
    future: F,
) -> F::Output {
    let context = user.map(|user| RequestDatabaseContext {
        user_id: user.user_id,
        role: user.role,
        is_system: false,
    });
    REQUEST_DATABASE_CONTEXT.scope(context, future).await
}

/// Run trusted user-specific work after credentials or a refresh token have
/// been verified, but before an access token context is available (for
/// example, resolving the user's current role during login).
pub async fn with_verified_database_user_context<F: Future>(
    user_id: Uuid,
    future: F,
) -> F::Output {
    REQUEST_DATABASE_CONTEXT
        .scope(
            Some(RequestDatabaseContext {
                user_id,
                role: "VERIFIED_USER".to_owned(),
                is_system: false,
            }),
            future,
        )
        .await
}

/// Run trusted internal work (for example, after verifying a payment webhook)
/// with a database system principal. Call only after authenticating the source.
pub async fn with_system_database_context<F: Future>(future: F) -> F::Output {
    REQUEST_DATABASE_CONTEXT
        .scope(
            Some(RequestDatabaseContext {
                user_id: Uuid::nil(),
                role: "system".to_owned(),
                is_system: true,
            }),
            future,
        )
        .await
}

fn current_database_context() -> Option<RequestDatabaseContext> {
    REQUEST_DATABASE_CONTEXT
        .try_with(Clone::clone)
        .ok()
        .flatten()
}

async fn set_postgres_context(
    connection: &mut sqlx::PgConnection,
    context: Option<RequestDatabaseContext>,
) -> Result<(), sqlx::Error> {
    let user_id = context
        .as_ref()
        .map(|context| context.user_id.to_string())
        .unwrap_or_default();
    let role = context
        .as_ref()
        .map(|context| context.role.clone())
        .unwrap_or_default();
    let is_system = context.as_ref().is_some_and(|context| context.is_system);

    sqlx::query(
        "SELECT set_config('votex.user_id', $1, false), set_config('votex.user_role', $2, false), set_config('votex.is_system', $3, false)",
    )
    .bind(user_id)
    .bind(role)
    .bind(is_system.to_string())
    .execute(connection)
    .await?;
    Ok(())
}

pub async fn build_pool(cfg: &DatabaseConfig) -> Result<PgPool, AppError> {
    build_pool_from_url(cfg, &cfg.url, false).await
}

pub async fn build_migrator_pool(cfg: &DatabaseConfig) -> Result<PgPool, AppError> {
    build_pool_from_url(cfg, &cfg.migrator_url, true).await
}

/// Refuse to run application traffic with a database role that can bypass RLS.
pub async fn validate_runtime_database_role(
    pool: &PgPool,
    expected_role: &str,
) -> Result<(), AppError> {
    let safe = sqlx::query_scalar::<_, bool>(
        r#"
        SELECT role.rolname = $1
           AND role.rolinherit
           AND NOT role.rolsuper
           AND NOT role.rolbypassrls
           AND pg_has_role(role.oid, 'votex_app', 'MEMBER')
           AND NOT EXISTS (
               SELECT 1
               FROM pg_class table_info
               JOIN pg_roles owner ON owner.oid = table_info.relowner
               WHERE table_info.relkind IN ('r', 'p')
                 AND table_info.relrowsecurity = TRUE
                 AND owner.oid = role.oid
           )
        FROM pg_roles role
        WHERE role.rolname = current_user
        "#,
    )
    .bind(expected_role)
    .fetch_optional(pool)
    .await
    .map_err(|error| AppError::Database(Box::new(error)))?
    .unwrap_or(false);

    if safe {
        Ok(())
    } else {
        Err(AppError::Configuration(format!(
            "DATABASE_URL must connect as the non-owner, non-superuser role '{expected_role}', which must inherit the votex_app role"
        )))
    }
}

async fn build_pool_from_url(
    cfg: &DatabaseConfig,
    url: &str,
    migrator: bool,
) -> Result<PgPool, AppError> {
    let connect_options: PgConnectOptions = url
        .parse()
        .map_err(|e: sqlx::Error| AppError::Configuration(e.to_string()))?;

    let runtime_role = cfg.runtime_role.clone();
    let pool = PgPoolOptions::new()
        .max_connections(cfg.max_connections)
        .min_connections(cfg.min_connections)
        .acquire_timeout(Duration::from_secs(cfg.acquire_timeout_secs))
        // SQLx invokes after_connect for new connections and before_acquire for
        // reused ones. Apply the current task's identity on every checkout.
        // after_release clears it; failures discard the connection.
        .after_connect(move |connection, _| {
            let runtime_role = runtime_role.clone();
            Box::pin(async move {
                set_postgres_context(connection, current_database_context()).await?;
                if migrator {
                    sqlx::query("SELECT set_config('votex.runtime_role', $1, false)")
                        .bind(runtime_role)
                        .execute(connection)
                        .await?;
                }
                Ok(())
            })
        })
        .before_acquire(|connection, _| {
            Box::pin(async move {
                set_postgres_context(connection, current_database_context()).await?;
                Ok(true)
            })
        })
        .after_release(|connection, _| {
            Box::pin(async move {
                set_postgres_context(connection, None).await?;
                Ok(true)
            })
        })
        .connect_with(connect_options)
        .await
        .map_err(|e| AppError::Database(Box::new(e)))?;

    info!(
        max_connections = cfg.max_connections,
        "database pool established"
    );

    Ok(pool)
}
