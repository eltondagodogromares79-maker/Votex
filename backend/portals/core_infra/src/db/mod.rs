use std::time::Duration;

use sqlx::PgPool;
use sqlx::postgres::{PgConnectOptions, PgPoolOptions};
use tracing::info;

use crate::{config::DatabaseConfig, errors::AppError};

pub async fn build_pool(cfg: &DatabaseConfig) -> Result<PgPool, AppError> {
    let connect_options: PgConnectOptions = cfg
        .url
        .parse()
        .map_err(|e: sqlx::Error| AppError::Configuration(e.to_string()))?;

    let pool = PgPoolOptions::new()
        .max_connections(cfg.max_connections)
        .min_connections(cfg.min_connections)
        .acquire_timeout(Duration::from_secs(cfg.acquire_timeout_secs))
        .connect_with(connect_options)
        .await
        .map_err(|e| AppError::Database(Box::new(e)))?;

    info!(
        max_connections = cfg.max_connections,
        "database pool established"
    );

    Ok(pool)
}
