use chrono::Utc;
use coordinator::{
    application::ports::{
        pageant_setup_workflow::PageantSetupWorkflow, round_workflow::RoundWorkflow,
    },
    domain::{
        pageant_setup::PageantCategory,
        round::{PageantRound, RoundStatus},
    },
    infrastructure::postgres::{
        pageant_setup_workflow::PostgresPageantSetupWorkflow, round_workflow::PostgresRoundWorkflow,
    },
};
use sqlx::PgPool;
use uuid::Uuid;

struct Fixture {
    coordinator_id: Uuid,
    pageant_id: Uuid,
}

async fn fixture(pool: &PgPool) -> Fixture {
    let owner_id = create_user(pool, "owner").await;
    let coordinator_id = create_user(pool, "coordinator").await;
    let organization_id = sqlx::query_scalar::<_, Uuid>(
        "INSERT INTO organizations (owner_id, name, slug) VALUES ($1, 'Coordinator Limit Org', $2) RETURNING id",
    )
    .bind(owner_id)
    .bind(format!("coordinator-limit-{}", Uuid::new_v4()))
    .fetch_one(pool)
    .await
    .unwrap();
    let plan_id = sqlx::query_scalar::<_, Uuid>(
        "INSERT INTO subscription_plans (code, name, kind, price_amount, currency, max_pageants, max_tabulator_users, max_judges_per_pageant, max_rounds_per_pageant, max_categories_per_round) VALUES ($1, 'Coordinator Limit Plan', 'CUSTOM', 0, 'PHP', 2, 2, 2, 1, 1) RETURNING id",
    )
    .bind(format!("COORD_LIMIT_{}", Uuid::new_v4().simple()))
    .fetch_one(pool)
    .await
    .unwrap();
    sqlx::query("INSERT INTO organization_subscriptions (organization_id, plan_id, status, starts_at) VALUES ($1, $2, 'ACTIVE', now())")
        .bind(organization_id)
        .bind(plan_id)
        .execute(pool)
        .await
        .unwrap();
    let pageant_id = Uuid::new_v4();
    sqlx::query("INSERT INTO pageants (id, organization_id, created_by, name, slug) VALUES ($1, $2, $3, 'Coordinator Limit Pageant', $4)")
        .bind(pageant_id)
        .bind(organization_id)
        .bind(owner_id)
        .bind(format!("coord-pageant-{}", Uuid::new_v4().simple()))
        .execute(pool)
        .await
        .unwrap();
    let coordinator_role =
        sqlx::query_scalar::<_, Uuid>("SELECT id FROM roles WHERE code = 'PAGEANT_COORDINATOR'")
            .fetch_one(pool)
            .await
            .unwrap();
    sqlx::query("INSERT INTO organization_members (organization_id, user_id) VALUES ($1, $2)")
        .bind(organization_id)
        .bind(coordinator_id)
        .execute(pool)
        .await
        .unwrap();
    sqlx::query("INSERT INTO pageant_member_roles (pageant_id, user_id, role_id, assigned_by) VALUES ($1, $2, $3, $4)")
        .bind(pageant_id)
        .bind(coordinator_id)
        .bind(coordinator_role)
        .bind(owner_id)
        .execute(pool)
        .await
        .unwrap();
    Fixture {
        coordinator_id,
        pageant_id,
    }
}

async fn create_round(
    pool: &PgPool,
    fixture: &Fixture,
    name: &str,
    number: i32,
) -> Result<PageantRound, core_infra::AppError> {
    let now = Utc::now();
    PostgresRoundWorkflow::new(pool.clone())
        .create(
            fixture.coordinator_id,
            PageantRound {
                id: Uuid::new_v4(),
                pageant_id: fixture.pageant_id,
                name: name.into(),
                round_number: number,
                round_type: "Preliminary".into(),
                status: RoundStatus::Draft,
                advancement_count: None,
                starts_at: None,
                ends_at: None,
                created_at: now,
                updated_at: now,
            },
        )
        .await
}

async fn create_category(
    pool: &PgPool,
    fixture: &Fixture,
    round_id: Uuid,
    code: &str,
) -> Result<PageantCategory, core_infra::AppError> {
    let now = Utc::now();
    PostgresPageantSetupWorkflow::new(pool.clone())
        .create_category(
            fixture.coordinator_id,
            Some(round_id),
            PageantCategory {
                id: Uuid::new_v4(),
                pageant_id: fixture.pageant_id,
                code: code.into(),
                name: format!("Category {code}"),
                description: None,
                display_order: 0,
                eligibility_scope: "OPEN".into(),
                eligibility_notes: None,
                is_active: true,
                status: "DRAFT".into(),
                created_at: now,
                updated_at: now,
            },
        )
        .await
}

async fn create_user(pool: &PgPool, prefix: &str) -> Uuid {
    sqlx::query_scalar::<_, Uuid>(
        "INSERT INTO users (email, first_name, last_name, status) VALUES ($1, 'Test', 'User', 'ACTIVE') RETURNING id",
    )
    .bind(format!("{prefix}-{}@example.test", Uuid::new_v4()))
    .fetch_one(pool)
    .await
    .unwrap()
}

#[sqlx::test(migrations = "../../migrations")]
async fn coordinator_cannot_create_round_beyond_subscription_limit(pool: PgPool) {
    let fixture = fixture(&pool).await;
    create_round(&pool, &fixture, "First", 1).await.unwrap();

    let result = create_round(&pool, &fixture, "Second", 2).await;

    assert!(matches!(result, Err(core_infra::AppError::BadRequest(_))));
    let rounds =
        sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM pageant_rounds WHERE pageant_id = $1")
            .bind(fixture.pageant_id)
            .fetch_one(&pool)
            .await
            .unwrap();
    assert_eq!(rounds, 1, "rejected round must not be inserted");
}

#[sqlx::test(migrations = "../../migrations")]
async fn category_limit_is_enforced_per_round_and_allows_another_round(pool: PgPool) {
    let fixture = fixture(&pool).await;
    let first_round = create_round(&pool, &fixture, "First", 1).await.unwrap();
    let second_round = sqlx::query_scalar::<_, Uuid>(
        "INSERT INTO pageant_rounds (pageant_id, name, round_number, round_type) VALUES ($1, 'Second', 2, 'Final') RETURNING id",
    )
    .bind(fixture.pageant_id)
    .fetch_one(&pool)
    .await
    .unwrap();
    create_category(&pool, &fixture, first_round.id, "CAT_ONE")
        .await
        .unwrap();

    let over_limit = create_category(&pool, &fixture, first_round.id, "CAT_TWO").await;
    let next_round = create_category(&pool, &fixture, second_round, "CAT_THREE").await;

    assert!(matches!(
        over_limit,
        Err(core_infra::AppError::BadRequest(_))
    ));
    assert!(
        next_round.is_ok(),
        "category quota must reset for each round"
    );
    let first_round_categories = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM pageant_round_categories WHERE round_id = $1",
    )
    .bind(first_round.id)
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(first_round_categories, 1);
}
