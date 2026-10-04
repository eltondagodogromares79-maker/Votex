use sqlx::PgPool;
use uuid::Uuid;

use crate::{
    application::ports::authorization_workflow::{AuthorizationScope, AuthorizationWorkflow},
    infrastructure::postgres::authorization_workflow::PostgresAuthorizationWorkflow,
};

// -----------------------------------------------------------------------------
// Test helpers
// -----------------------------------------------------------------------------

async fn create_test_user(pool: &PgPool) -> Uuid {
    sqlx::query_scalar!(
        r#"
        INSERT INTO users (
            email,
            password_hash,
            first_name,     
            last_name,
            status
        )
        VALUES (
            $1,
            NULL,
            'Authorization',
            'Test User',
            'ACTIVE'
        )
        RETURNING id
        "#,
        format!("auth-test-{}@example.com", Uuid::new_v4())
    )
    .fetch_one(pool)
    .await
    .expect("failed to create test user")
}

async fn get_role_id(pool: &PgPool, role_code: &str) -> Uuid {
    sqlx::query_scalar!(
        r#"
        SELECT id
        FROM roles
        WHERE code = $1
        "#,
        role_code
    )
    .fetch_one(pool)
    .await
    .unwrap_or_else(|_| panic!("role {role_code} does not exist"))
}

async fn get_permission_id(pool: &PgPool, permission_code: &str) -> Uuid {
    sqlx::query_scalar!(
        r#"
        SELECT id
        FROM permissions
        WHERE code = $1
        "#,
        permission_code
    )
    .fetch_one(pool)
    .await
    .unwrap_or_else(|_| panic!("permission {permission_code} does not exist"))
}

async fn assign_permission_to_role(pool: &PgPool, role_code: &str, permission_code: &str) {
    let role_id = get_role_id(pool, role_code).await;
    let permission_id = get_permission_id(pool, permission_code).await;

    sqlx::query!(
        r#"
        INSERT INTO role_permissions (
            role_id,
            permission_id
        )
        VALUES ($1, $2)
        ON CONFLICT (role_id, permission_id) DO NOTHING
        "#,
        role_id,
        permission_id
    )
    .execute(pool)
    .await
    .expect("failed to assign permission to role");
}

async fn assign_system_role(pool: &PgPool, user_id: Uuid, role_code: &str) {
    let role_id = get_role_id(pool, role_code).await;

    sqlx::query!(
        r#"
        INSERT INTO user_system_roles (
            user_id,
            role_id
        )
        VALUES ($1, $2)
        ON CONFLICT (user_id, role_id) DO NOTHING
        "#,
        user_id,
        role_id
    )
    .execute(pool)
    .await
    .expect("failed to assign system role");
}

async fn create_test_organization(pool: &PgPool, owner_id: Uuid) -> Uuid {
    sqlx::query_scalar!(
        r#"
        INSERT INTO organizations (
            owner_id,
            name,
            slug
        )
        VALUES (
            $1,
            $2,
            $3
        )
        RETURNING id
        "#,
        owner_id,
        format!("Authorization Test Organization {}", Uuid::new_v4()),
        format!("auth-test-{}", Uuid::new_v4())
    )
    .fetch_one(pool)
    .await
    .expect("failed to create test organization")
}

async fn create_organization_member(pool: &PgPool, organization_id: Uuid, user_id: Uuid) -> Uuid {
    sqlx::query_scalar!(
        r#"
        INSERT INTO organization_members (
            organization_id,
            user_id
        )
        VALUES ($1, $2)
        RETURNING id
        "#,
        organization_id,
        user_id
    )
    .fetch_one(pool)
    .await
    .expect("failed to create organization member")
}

async fn assign_organization_role(pool: &PgPool, organization_member_id: Uuid, role_code: &str) {
    let role_id = get_role_id(pool, role_code).await;

    sqlx::query!(
        r#"
        INSERT INTO organization_member_roles (
            organization_member_id,
            role_id
        )
        VALUES ($1, $2)
        ON CONFLICT (
            organization_member_id,
            role_id
        ) DO NOTHING
        "#,
        organization_member_id,
        role_id
    )
    .execute(pool)
    .await
    .expect("failed to assign organization role");
}

async fn create_test_pageant(pool: &PgPool, organization_id: Uuid, created_by: Uuid) -> Uuid {
    sqlx::query_scalar!(
        r#"
        INSERT INTO pageants (
            organization_id,
            created_by,
            name,
            slug
        )
        VALUES (
            $1,
            $2,
            $3,
            $4
        )
        RETURNING id
        "#,
        organization_id,
        created_by,
        format!("Authorization Test Pageant {}", Uuid::new_v4()),
        format!("auth-test-pageant-{}", Uuid::new_v4())
    )
    .fetch_one(pool)
    .await
    .expect("failed to create test pageant")
}

async fn assign_pageant_role(pool: &PgPool, pageant_id: Uuid, user_id: Uuid, role_code: &str) {
    let role_id = get_role_id(pool, role_code).await;

    sqlx::query!(
        r#"
        INSERT INTO pageant_member_roles (
            pageant_id,
            user_id,
            role_id
        )
        VALUES ($1, $2, $3)
        ON CONFLICT (
            pageant_id,
            user_id,
            role_id
        ) DO NOTHING
        "#,
        pageant_id,
        user_id,
        role_id
    )
    .execute(pool)
    .await
    .expect("failed to assign pageant role");
}

// -----------------------------------------------------------------------------
// SYSTEM authorization
// -----------------------------------------------------------------------------

#[sqlx::test(migrations = "../migrations")]
async fn system_permission_is_granted_to_user_with_matching_role(pool: PgPool) {
    assign_permission_to_role(&pool, "PLATFORM_ADMIN", "audit.read").await;

    let user_id = create_test_user(&pool).await;

    assign_system_role(&pool, user_id, "PLATFORM_ADMIN").await;

    let workflow = PostgresAuthorizationWorkflow::new(pool);

    let result = workflow
        .has_permission(user_id, AuthorizationScope::System, "audit.read")
        .await
        .expect("authorization query failed");

    assert!(result);
}

#[sqlx::test(migrations = "../migrations")]
async fn system_permission_is_denied_when_user_does_not_have_role(pool: PgPool) {
    assign_permission_to_role(&pool, "PLATFORM_ADMIN", "audit.read").await;

    let user_id = create_test_user(&pool).await;

    let workflow = PostgresAuthorizationWorkflow::new(pool);

    let result = workflow
        .has_permission(user_id, AuthorizationScope::System, "audit.read")
        .await
        .expect("authorization query failed");

    assert!(!result);
}

// -----------------------------------------------------------------------------
// ORGANIZATION authorization
// -----------------------------------------------------------------------------
#[sqlx::test(migrations = "../migrations")]
async fn organization_permission_is_granted_for_correct_organization(pool: PgPool) {
    assign_permission_to_role(&pool, "ORG_OWNER", "organization.update").await;

    let user_id = create_test_user(&pool).await;

    let organization_id = create_test_organization(&pool, user_id).await;

    let member_id = create_organization_member(&pool, organization_id, user_id).await;

    assign_organization_role(&pool, member_id, "ORG_OWNER").await;

    let workflow = PostgresAuthorizationWorkflow::new(pool);

    let result = workflow
        .has_permission(
            user_id,
            AuthorizationScope::Organization { organization_id },
            "organization.update",
        )
        .await
        .expect("authorization query failed");

    assert!(result);
}

#[sqlx::test(migrations = "../migrations")]
async fn organization_permission_is_denied_for_different_organization(pool: PgPool) {
    assign_permission_to_role(&pool, "ORG_OWNER", "organization.update").await;

    let user_id = create_test_user(&pool).await;

    let organization_a = create_test_organization(&pool, user_id).await;

    let organization_b_owner = create_test_user(&pool).await;

    let organization_b = create_test_organization(&pool, organization_b_owner).await;

    let member_id = create_organization_member(&pool, organization_a, user_id).await;

    assign_organization_role(&pool, member_id, "ORG_OWNER").await;

    let workflow = PostgresAuthorizationWorkflow::new(pool);

    let result = workflow
        .has_permission(
            user_id,
            AuthorizationScope::Organization {
                organization_id: organization_b,
            },
            "organization.update",
        )
        .await
        .expect("authorization query failed");

    assert!(!result);
}

#[sqlx::test(migrations = "../migrations")]
async fn organization_permission_is_denied_for_inactive_membership(pool: PgPool) {
    assign_permission_to_role(&pool, "ORG_OWNER", "organization.update").await;

    let user_id = create_test_user(&pool).await;

    let organization_id = create_test_organization(&pool, user_id).await;

    let member_id = create_organization_member(&pool, organization_id, user_id).await;

    assign_organization_role(&pool, member_id, "ORG_OWNER").await;

    sqlx::query!(
        r#"
        UPDATE organization_members
        SET is_active = FALSE
        WHERE id = $1
        "#,
        member_id
    )
    .execute(&pool)
    .await
    .expect("failed to deactivate organization membership");

    let workflow = PostgresAuthorizationWorkflow::new(pool);

    let result = workflow
        .has_permission(
            user_id,
            AuthorizationScope::Organization { organization_id },
            "organization.update",
        )
        .await
        .expect("authorization query failed");

    assert!(!result);
}

// -----------------------------------------------------------------------------
// PAGEANT authorization
// -----------------------------------------------------------------------------

#[sqlx::test(migrations = "../migrations")]
async fn pageant_permission_is_granted_for_correct_pageant(pool: PgPool) {
    assign_permission_to_role(&pool, "PAGEANT_JUDGE", "score.submit").await;

    let user_id = create_test_user(&pool).await;

    let organization_id = create_test_organization(&pool, user_id).await;

    // Required by validate_pageant_role_assignment().
    create_organization_member(&pool, organization_id, user_id).await;

    let pageant_id = create_test_pageant(&pool, organization_id, user_id).await;

    assign_pageant_role(&pool, pageant_id, user_id, "PAGEANT_JUDGE").await;

    let workflow = PostgresAuthorizationWorkflow::new(pool);

    let result = workflow
        .has_permission(
            user_id,
            AuthorizationScope::Pageant { pageant_id },
            "score.submit",
        )
        .await
        .expect("authorization query failed");

    assert!(result);
}

#[sqlx::test(migrations = "../migrations")]
async fn pageant_permission_is_denied_for_different_pageant(pool: PgPool) {
    assign_permission_to_role(&pool, "PAGEANT_JUDGE", "score.submit").await;

    let user_id = create_test_user(&pool).await;

    let organization_id = create_test_organization(&pool, user_id).await;

    // Required by validate_pageant_role_assignment().
    create_organization_member(&pool, organization_id, user_id).await;

    let assigned_pageant_id = create_test_pageant(&pool, organization_id, user_id).await;

    let different_pageant_id = create_test_pageant(&pool, organization_id, user_id).await;

    assign_pageant_role(&pool, assigned_pageant_id, user_id, "PAGEANT_JUDGE").await;

    let workflow = PostgresAuthorizationWorkflow::new(pool);

    let result = workflow
        .has_permission(
            user_id,
            AuthorizationScope::Pageant {
                pageant_id: different_pageant_id,
            },
            "score.submit",
        )
        .await
        .expect("authorization query failed");

    assert!(!result);
}

#[sqlx::test(migrations = "../migrations")]
async fn pageant_permission_is_denied_for_inactive_assignment(pool: PgPool) {
    assign_permission_to_role(&pool, "PAGEANT_JUDGE", "score.submit").await;

    let user_id = create_test_user(&pool).await;

    let organization_id = create_test_organization(&pool, user_id).await;

    // Required by validate_pageant_role_assignment().
    create_organization_member(&pool, organization_id, user_id).await;

    let pageant_id = create_test_pageant(&pool, organization_id, user_id).await;

    assign_pageant_role(&pool, pageant_id, user_id, "PAGEANT_JUDGE").await;

    sqlx::query!(
        r#"
        UPDATE pageant_member_roles
        SET is_active = FALSE
        WHERE pageant_id = $1
          AND user_id = $2
        "#,
        pageant_id,
        user_id
    )
    .execute(&pool)
    .await
    .expect("failed to deactivate pageant assignment");

    let workflow = PostgresAuthorizationWorkflow::new(pool);

    let result = workflow
        .has_permission(
            user_id,
            AuthorizationScope::Pageant { pageant_id },
            "score.submit",
        )
        .await
        .expect("authorization query failed");

    assert!(!result);
}
