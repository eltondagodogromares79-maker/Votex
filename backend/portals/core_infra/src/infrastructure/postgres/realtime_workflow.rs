use sqlx::{PgPool, postgres::PgListener};
use uuid::Uuid;

use crate::infrastructure::realtime::RealtimeHub;

pub async fn can_access_pageant(
    pool: &PgPool,
    user_id: Uuid,
    role: &str,
    pageant_id: Uuid,
) -> Result<bool, sqlx::Error> {
    sqlx::query_scalar::<_, bool>(
        "SELECT \
           EXISTS (SELECT 1 FROM pageant_member_roles pmr \
                   JOIN roles r ON r.id = pmr.role_id \
                   WHERE pmr.pageant_id = $1 AND pmr.user_id = $2 AND pmr.is_active = TRUE \
                     AND r.is_active = TRUE AND r.code = CASE $3 \
                       WHEN 'coordinator' THEN 'PAGEANT_COORDINATOR' \
                       WHEN 'judge' THEN 'PAGEANT_JUDGE' \
                       WHEN 'tabulator' THEN 'PAGEANT_TABULATOR' \
                       ELSE '' END) \
           OR ($3 = 'org_owner' AND EXISTS ( \
               SELECT 1 FROM pageants p JOIN organizations o ON o.id = p.organization_id \
               WHERE p.id = $1 AND o.owner_id = $2 AND o.is_active = TRUE))",
    )
    .bind(pageant_id)
    .bind(user_id)
    .bind(role)
    .fetch_one(pool)
    .await
}

pub async fn publish_pageant_event(
    pool: &PgPool,
    pageant_id: Uuid,
    event: &str,
) -> Result<(), sqlx::Error> {
    sqlx::query("SELECT pg_notify('votex_pageant_events', $1)")
        .bind(format!("{pageant_id}|{event}"))
        .execute(pool)
        .await?;
    Ok(())
}

pub fn start_pageant_event_listener(pool: PgPool, hub: std::sync::Arc<RealtimeHub>) {
    tokio::spawn(async move {
        loop {
            let mut listener = match PgListener::connect_with(&pool).await {
                Ok(listener) => listener,
                Err(error) => {
                    tracing::warn!(%error, "realtime listener could not connect; retrying");
                    tokio::time::sleep(std::time::Duration::from_secs(2)).await;
                    continue;
                }
            };
            if let Err(error) = listener.listen("votex_pageant_events").await {
                tracing::warn!(%error, "realtime listener could not subscribe; retrying");
                tokio::time::sleep(std::time::Duration::from_secs(2)).await;
                continue;
            }
            loop {
                match listener.recv().await {
                    Ok(notification) => {
                        if let Some((pageant_id, event)) = notification.payload().split_once('|') {
                            if let Ok(pageant_id) = Uuid::parse_str(pageant_id) {
                                hub.publish_pageant(pageant_id, event);
                            }
                        }
                    }
                    Err(error) => {
                        tracing::warn!(%error, "realtime listener disconnected; reconnecting");
                        break;
                    }
                }
            }
            tokio::time::sleep(std::time::Duration::from_secs(1)).await;
        }
    });
}
