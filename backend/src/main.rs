use core_infra::{
    config::AppConfig,
    db::{build_migrator_pool, build_pool, validate_runtime_database_role},
    telemetry::init_tracing,
};

#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok();

    let cfg = AppConfig::from_env();

    init_tracing(&cfg.env);

    let migration_pool = build_migrator_pool(&cfg.database)
        .await
        .expect("failed to connect to migration database");

    sqlx::migrate!("./migrations")
        .run(&migration_pool)
        .await
        .expect("failed to run migrations");
    migration_pool.close().await;

    let pool = build_pool(&cfg.database)
        .await
        .expect("failed to connect to runtime database");
    validate_runtime_database_role(&pool, &cfg.database.runtime_role)
        .await
        .expect("runtime database role is not configured for row-level security");

    api_server::bootstrap(cfg, pool)
        .await
        .expect("server error");
}
