-- VoteX - 028 Rename subscription_plan_kind enum values
-- Changes PER_EVENT/MONTHLY/YEARLY/ENTERPRISE/CUSTOM → ONE_TIME/PREMIUM/CUSTOM
-- Also removes all seeded plan rows so admin can create plans from the UI.

-- Step 1: Delete all existing seeded plan rows first (no FK refs in org yet in dev).
-- ON DELETE RESTRICT on subscription_plans means we must clear subscriptions first.
DELETE FROM organization_subscriptions
WHERE plan_id IN (SELECT id FROM subscription_plans);

DELETE FROM subscription_plans;

-- Step 2: Rename the enum type by creating a new one and swapping.
-- PostgreSQL doesn't support DROP VALUE or RENAME VALUE directly,
-- so we create a new type, alter the column, then drop the old type.

CREATE TYPE subscription_plan_kind_new AS ENUM ('ONE_TIME', 'PREMIUM', 'CUSTOM');

ALTER TABLE subscription_plans
    ALTER COLUMN kind TYPE subscription_plan_kind_new
    USING (
        CASE kind::text
            WHEN 'PER_EVENT'  THEN 'ONE_TIME'
            WHEN 'MONTHLY'    THEN 'PREMIUM'
            WHEN 'YEARLY'     THEN 'PREMIUM'
            WHEN 'ENTERPRISE' THEN 'CUSTOM'
            WHEN 'CUSTOM'     THEN 'CUSTOM'
            ELSE 'CUSTOM'
        END
    )::subscription_plan_kind_new;

DROP TYPE subscription_plan_kind;

ALTER TYPE subscription_plan_kind_new RENAME TO subscription_plan_kind;
