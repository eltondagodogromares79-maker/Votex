mod app;
mod bootstrap;
mod realtime;
mod server;

use sqlx::PgPool;

use core_infra::config::AppConfig;

use crate::bootstrap::dependencies::build_dependencies;

/// Single entry point called from `main.rs`.
///
/// Builds application dependencies and starts the HTTP server.
pub async fn bootstrap(cfg: AppConfig, pool: PgPool) -> std::io::Result<()> {
    let dependencies =
        build_dependencies(&cfg.auth, &cfg.payments, &cfg.server.frontend_url, pool)?;

    server::run(cfg.server, dependencies).await
}
