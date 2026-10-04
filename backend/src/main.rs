use core_infra::{config::AppConfig, db::build_pool, telemetry::init_tracing};

#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok();

    let cfg = AppConfig::from_env();

    init_tracing(&cfg.env);

    let pool = build_pool(&cfg.database)
        .await
        .expect("failed to connect to database");

    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .expect("failed to run migrations");

    api_server::bootstrap(cfg, pool)
        .await
        .expect("server error");
}
