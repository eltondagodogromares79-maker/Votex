-- Enforce a single open subscription even when concurrent requests race.
CREATE UNIQUE INDEX IF NOT EXISTS uq_one_open_subscription_per_org
ON organization_subscriptions(organization_id)
WHERE status IN ('TRIALING', 'ACTIVE', 'PAST_DUE', 'PAUSED', 'PENDING_PAYMENT');

DROP INDEX IF EXISTS uq_one_active_subscription_per_org;
