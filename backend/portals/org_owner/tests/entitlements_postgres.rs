use org_owner::{
    application::ports::{
        pageant_staff_workflow::PageantStaffWorkflow, pageant_workflow::PageantWorkflow,
    },
    domain::{pageant::Pageant, pageant_staff::PageantStaffRole},
    infrastructure::postgres::{
        pageant_staff_workflow::PostgresPageantStaffWorkflow,
        pageant_workflow::PostgresPageantWorkflow,
    },
};
use sqlx::PgPool;
use uuid::Uuid;

struct Fixture {
    owner_id: Uuid,
    organization_id: Uuid,
}

async fn fixture(pool: &PgPool) -> Fixture {
    let owner_id = create_user(pool, "owner").await;
    let organization_id = sqlx::query_scalar::<_, Uuid>(
        "INSERT INTO organizations (owner_id, name, slug) VALUES ($1, 'Limit Test Org', $2) RETURNING id",
    )
    .bind(owner_id)
    .bind(format!("limit-test-{}", Uuid::new_v4()))
    .fetch_one(pool)
    .await
    .unwrap();
    let plan_id = sqlx::query_scalar::<_, Uuid>(
        "INSERT INTO subscription_plans (code, name, kind, price_amount, currency, max_pageants, max_tabulator_users, max_judges_per_pageant, max_rounds_per_pageant, max_categories_per_round) VALUES ($1, 'Limit Test Plan', 'CUSTOM', 0, 'PHP', 1, 1, 1, 3, 1) RETURNING id",
    )
    .bind(format!("LIMIT_{}", Uuid::new_v4().simple()))
    .fetch_one(pool)
    .await
    .unwrap();
    sqlx::query("INSERT INTO organization_subscriptions (organization_id, plan_id, status, starts_at) VALUES ($1, $2, 'ACTIVE', now())")
        .bind(organization_id)
        .bind(plan_id)
        .execute(pool)
        .await
        .unwrap();
    Fixture {
        owner_id,
        organization_id,
    }
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

async fn insert_pageant(pool: &PgPool, fixture: &Fixture, slug: &str) -> Uuid {
    let id = Uuid::new_v4();
    sqlx::query("INSERT INTO pageants (id, organization_id, created_by, name, slug) VALUES ($1, $2, $3, 'Limit Test Pageant', $4)")
        .bind(id)
        .bind(fixture.organization_id)
        .bind(fixture.owner_id)
        .bind(format!("{slug}-{}", Uuid::new_v4().simple()))
        .execute(pool)
        .await
        .unwrap();
    id
}

fn pageant(fixture: &Fixture) -> Pageant {
    Pageant {
        id: Uuid::new_v4(),
        organization_id: fixture.organization_id,
        created_by: fixture.owner_id,
        name: "Second Pageant".into(),
        slug: format!("second-{}", Uuid::new_v4().simple()),
        description: None,
        logo_url: None,
        event_date: None,
        start_time: None,
        end_time: None,
        venue: None,
        status: "DRAFT".into(),
        is_public: false,
    }
}

async fn assign_staff(
    pool: &PgPool,
    fixture: &Fixture,
    pageant_id: Uuid,
    role: PageantStaffRole,
    email: String,
) -> Result<(), core_infra::AppError> {
    PostgresPageantStaffWorkflow::new(pool.clone())
        .assign(
            fixture.organization_id,
            pageant_id,
            fixture.owner_id,
            &email,
            Some("Staff"),
            Some("Member"),
            Some("test-hash"),
            role,
            false,
        )
        .await
        .map(|_| ())
}

#[sqlx::test(migrations = "../../migrations")]
async fn pageant_creation_is_rejected_once_plan_slot_is_used(pool: PgPool) {
    let fixture = fixture(&pool).await;
    insert_pageant(&pool, &fixture, "existing").await;

    let result = PostgresPageantWorkflow::new(pool.clone())
        .create_pageant(pageant(&fixture))
        .await;

    assert!(matches!(result, Err(core_infra::AppError::BadRequest(_))));
    let pageants =
        sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM pageants WHERE organization_id = $1")
            .bind(fixture.organization_id)
            .fetch_one(&pool)
            .await
            .unwrap();
    assert_eq!(pageants, 1, "rejected creation must not insert a pageant");
}

#[sqlx::test(migrations = "../../migrations")]
async fn judge_assignment_is_rejected_at_per_pageant_limit(pool: PgPool) {
    let fixture = fixture(&pool).await;
    let pageant_id = insert_pageant(&pool, &fixture, "judges").await;
    assign_staff(
        &pool,
        &fixture,
        pageant_id,
        PageantStaffRole::Judge,
        format!("judge-one-{}@example.test", Uuid::new_v4()),
    )
    .await
    .unwrap();
    let second_email = format!("judge-two-{}@example.test", Uuid::new_v4());

    let result = assign_staff(
        &pool,
        &fixture,
        pageant_id,
        PageantStaffRole::Judge,
        second_email.clone(),
    )
    .await;

    assert!(matches!(result, Err(core_infra::AppError::BadRequest(_))));
    let second_account_exists =
        sqlx::query_scalar::<_, bool>("SELECT EXISTS (SELECT 1 FROM users WHERE email = $1)")
            .bind(second_email)
            .fetch_one(&pool)
            .await
            .unwrap();
    assert!(
        !second_account_exists,
        "limit rejection must happen before creating the account"
    );
}

#[sqlx::test(migrations = "../../migrations")]
async fn tabulator_limit_is_shared_across_pageants_in_the_organization(pool: PgPool) {
    let fixture = fixture(&pool).await;
    let first_pageant = insert_pageant(&pool, &fixture, "tabulator-a").await;
    let second_pageant = insert_pageant(&pool, &fixture, "tabulator-b").await;
    assign_staff(
        &pool,
        &fixture,
        first_pageant,
        PageantStaffRole::Tabulator,
        format!("tabulator-one-{}@example.test", Uuid::new_v4()),
    )
    .await
    .unwrap();

    let result = assign_staff(
        &pool,
        &fixture,
        second_pageant,
        PageantStaffRole::Tabulator,
        format!("tabulator-two-{}@example.test", Uuid::new_v4()),
    )
    .await;

    assert!(matches!(result, Err(core_infra::AppError::BadRequest(_))));
    let active_tabulator_count = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(DISTINCT assignment.user_id) FROM pageant_member_roles assignment JOIN roles role ON role.id = assignment.role_id JOIN pageants pageant ON pageant.id = assignment.pageant_id WHERE pageant.organization_id = $1 AND assignment.is_active AND role.code = 'PAGEANT_TABULATOR'",
    )
    .bind(fixture.organization_id)
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(active_tabulator_count, 1);
}
