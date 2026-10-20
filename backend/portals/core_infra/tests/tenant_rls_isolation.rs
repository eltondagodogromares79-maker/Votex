use core_infra::{
    config::DatabaseConfig,
    db::{
        build_pool, validate_runtime_database_role, with_request_database_context,
        with_system_database_context,
    },
    domain::security::AuthenticatedUser,
};
use sqlx::{PgPool, postgres::PgPoolOptions};
use std::env;
use uuid::Uuid;

#[tokio::test]
async fn pageant_rows_are_isolated_between_organizations() {
    let (Some(admin_url), Some(runtime_url)) = (
        env::var("RLS_TEST_MIGRATOR_DATABASE_URL").ok(),
        env::var("RLS_TEST_DATABASE_URL").ok(),
    ) else {
        eprintln!("skipping tenant RLS integration test: set RLS_TEST_MIGRATOR_DATABASE_URL and RLS_TEST_DATABASE_URL");
        return;
    };

    let admin_pool = PgPoolOptions::new()
        .max_connections(1)
        .connect(&admin_url)
        .await
        .expect("connect with RLS test fixture role");
    let runtime_role = env::var("DATABASE_RUNTIME_ROLE")
        .unwrap_or_else(|_| "votex_runtime".to_owned());
    let runtime_pool = build_pool(&DatabaseConfig {
        url: runtime_url,
        migrator_url: admin_url,
        runtime_role: runtime_role.clone(),
        max_connections: 1,
        min_connections: 0,
        acquire_timeout_secs: 5,
    })
    .await
    .expect("connect with the non-owner RLS runtime role");
    validate_runtime_database_role(&runtime_pool, &runtime_role)
        .await
        .expect("runtime role must not bypass RLS");

    let suffix = Uuid::new_v4();
    let (user_one, org_one, pageant_one) = create_tenant(&admin_pool, suffix, 1).await;
    let (user_two, org_two, pageant_two) = create_tenant(&admin_pool, suffix, 2).await;

    let visible_to_one = visible_pageants(&runtime_pool, user_one, pageant_one, pageant_two).await;
    let visible_to_two = visible_pageants(&runtime_pool, user_two, pageant_one, pageant_two).await;

    assert_eq!(visible_to_one, vec![pageant_one]);
    assert_eq!(visible_to_two, vec![pageant_two]);

    let visible_without_login = with_request_database_context(
        None,
        sqlx::query_scalar::<_, Uuid>("SELECT id FROM pageants WHERE id = ANY($1) ORDER BY id")
            .bind(vec![pageant_one, pageant_two])
            .fetch_all(&runtime_pool),
    )
    .await
    .expect("public request must not see private pageants");
    assert!(visible_without_login.is_empty());

    let plan_id = Uuid::new_v4();
    sqlx::query(
        "INSERT INTO subscription_plans (id, code, name, kind, price_amount) VALUES ($1, $2, 'RLS Test Plan', 'ONE_TIME', 0)",
    )
    .bind(plan_id)
    .bind(format!("RLS_{}", Uuid::new_v4().simple()).to_uppercase())
    .execute(&admin_pool)
    .await
    .expect("create public plan fixture");

    let visible_public_plan = with_request_database_context(
        None,
        sqlx::query_scalar::<_, Uuid>("SELECT id FROM subscription_plans WHERE id = $1 AND is_active")
            .bind(plan_id)
            .fetch_optional(&runtime_pool),
    )
    .await
    .expect("public plans must remain readable");
    assert_eq!(visible_public_plan, Some(plan_id));

    let system_pageants = with_system_database_context(
        sqlx::query_scalar::<_, Uuid>("SELECT id FROM pageants WHERE id = ANY($1)")
            .bind(vec![pageant_one, pageant_two])
            .fetch_all(&runtime_pool),
    )
    .await
    .expect("trusted system jobs must read cross-tenant rows");
    assert_eq!(system_pageants.len(), 2);

    sqlx::query("DELETE FROM subscription_plans WHERE id = $1")
        .bind(plan_id)
        .execute(&admin_pool)
        .await
        .expect("clean up test plan");
    sqlx::query("DELETE FROM organizations WHERE id = ANY($1)")
        .bind(vec![org_one, org_two])
        .execute(&admin_pool)
        .await
        .expect("clean up test organizations");
    sqlx::query("DELETE FROM users WHERE id = ANY($1)")
        .bind(vec![user_one, user_two])
        .execute(&admin_pool)
        .await
        .expect("clean up test users");

    runtime_pool.close().await;
    admin_pool.close().await;
}

async fn create_tenant(pool: &PgPool, suffix: Uuid, ordinal: i32) -> (Uuid, Uuid, Uuid) {
    let user_id = Uuid::new_v4();
    let org_id = Uuid::new_v4();
    let pageant_id = Uuid::new_v4();
    let email = format!("rls-{suffix}-{ordinal}@example.invalid");
    let slug = format!("rls-{suffix}-{ordinal}");

    sqlx::query(
        "INSERT INTO users (id, email, first_name, last_name, status) VALUES ($1, $2, 'RLS', 'Test', 'ACTIVE')",
    )
    .bind(user_id)
    .bind(email)
    .execute(pool)
    .await
    .expect("create test user");
    sqlx::query("INSERT INTO organizations (id, owner_id, name, slug) VALUES ($1, $2, $3, $4)")
        .bind(org_id)
        .bind(user_id)
        .bind(format!("RLS Test Organization {ordinal}"))
        .bind(slug.clone())
        .execute(pool)
        .await
        .expect("create test organization");
    sqlx::query(
        "INSERT INTO pageants (id, organization_id, created_by, name, slug, status, is_public) VALUES ($1, $2, $3, 'RLS Isolation Test', $4, 'DRAFT', FALSE)",
    )
    .bind(pageant_id)
    .bind(org_id)
    .bind(user_id)
    .bind(format!("{slug}-pageant"))
    .execute(pool)
    .await
    .expect("create private test pageant");

    (user_id, org_id, pageant_id)
}

async fn visible_pageants(
    pool: &PgPool,
    user_id: Uuid,
    first: Uuid,
    second: Uuid,
) -> Vec<Uuid> {
    let user = AuthenticatedUser {
        user_id,
        session_id: Uuid::new_v4(),
        role: "org_owner".to_owned(),
    };
    with_request_database_context(
        Some(user),
        sqlx::query_scalar::<_, Uuid>(
            "SELECT id FROM pageants WHERE id = ANY($1) ORDER BY id",
        )
        .bind(vec![first, second])
        .fetch_all(pool),
    )
    .await
    .expect("query private pageants with RLS")
}
