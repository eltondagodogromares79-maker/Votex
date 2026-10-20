use core_infra::AppError;
use sqlx::{Postgres, Transaction};
use uuid::Uuid;

#[derive(sqlx::FromRow)]
pub struct PlanLimits {
    pub max_judges_per_pageant: Option<i32>,
    pub max_tabulator_users: Option<i32>,
    pub max_rounds_per_pageant: Option<i32>,
    pub max_categories_per_round: Option<i32>,
}

/// Serializes creation of limited resources for an organization and returns
/// the limits on its current plan. Call inside the same transaction as insert.
pub async fn lock_org_and_get_limits(
    transaction: &mut Transaction<'_, Postgres>,
    coordinator_id: Uuid,
    pageant_id: Uuid,
) -> Result<PlanLimits, AppError> {
    let organization_id = sqlx::query_scalar::<_, Uuid>(
        r#"
        SELECT organization.id
        FROM organizations organization
        INNER JOIN pageants pageant ON pageant.organization_id = organization.id
        WHERE pageant.id = $1
          AND EXISTS (
              SELECT 1
              FROM pageant_member_roles assignment
              INNER JOIN roles assigned_role ON assigned_role.id = assignment.role_id
              WHERE assignment.pageant_id = pageant.id
                AND assignment.user_id = $2
                AND assignment.is_active = TRUE
                AND assigned_role.code = 'PAGEANT_COORDINATOR'
                AND assigned_role.scope = 'PAGEANT'::role_scope
                AND assigned_role.is_active = TRUE
          )
        FOR UPDATE OF organization
        "#,
    )
    .bind(pageant_id)
    .bind(coordinator_id)
    .fetch_optional(&mut **transaction)
    .await
    .map_err(database_error)?
    .ok_or(AppError::Forbidden)?;

    sqlx::query_as::<_, PlanLimits>(
        r#"
        SELECT plan.max_judges_per_pageant, plan.max_tabulator_users,
               plan.max_rounds_per_pageant, plan.max_categories_per_round
        FROM organization_subscriptions subscription
        INNER JOIN subscription_plans plan ON plan.id = subscription.plan_id
        WHERE subscription.organization_id = $1
          AND subscription.status IN ('TRIALING', 'ACTIVE', 'PAST_DUE', 'PAUSED')
        ORDER BY subscription.created_at DESC, subscription.id DESC
        LIMIT 1
        "#,
    )
    .bind(organization_id)
    .fetch_optional(&mut **transaction)
    .await
    .map_err(database_error)?
    .ok_or_else(|| AppError::BadRequest(
        "Your organization does not have an active subscription. Please subscribe to a plan to manage pageant resources.".to_owned(),
    ))
}

pub fn ensure_below_limit(
    current: i64,
    limit: Option<i32>,
    resource: &str,
) -> Result<(), AppError> {
    if let Some(limit) = limit {
        if current >= i64::from(limit) {
            return Err(AppError::BadRequest(format!(
                "Your current plan allows a maximum of {limit} {resource}. You have reached this limit. Please upgrade your plan to create more."
            )));
        }
    }
    Ok(())
}

pub fn ensure_within_limit(
    current: i64,
    limit: Option<i32>,
    resource: &str,
) -> Result<(), AppError> {
    if let Some(limit) = limit {
        if current > i64::from(limit) {
            return Err(AppError::BadRequest(format!(
                "Your current plan allows a maximum of {limit} {resource}. Reduce the number selected or upgrade your plan."
            )));
        }
    }
    Ok(())
}

fn database_error(error: sqlx::Error) -> AppError {
    AppError::Database(Box::new(error))
}
