-- VoteX - 003 Billing and Subscriptions
CREATE TYPE subscription_plan_kind AS ENUM ('PER_EVENT', 'MONTHLY', 'YEARLY', 'ENTERPRISE', 'CUSTOM');
CREATE TYPE subscription_status AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'PAUSED', 'CANCELLED', 'EXPIRED');
CREATE TYPE payment_status AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED');

CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    kind subscription_plan_kind NOT NULL,
    price_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (price_amount >= 0),
    currency CHAR(3) NOT NULL DEFAULT 'PHP',
    billing_interval_months INTEGER CHECK (billing_interval_months IS NULL OR billing_interval_months > 0),
    max_pageants INTEGER CHECK (max_pageants IS NULL OR max_pageants > 0),
    max_tabulator_users INTEGER CHECK (max_tabulator_users IS NULL OR max_tabulator_users > 0),
    customization_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE organization_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
    status subscription_status NOT NULL DEFAULT 'TRIALING',
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ,
    external_customer_id TEXT,
    external_subscription_id TEXT,
    pageants_used INTEGER NOT NULL DEFAULT 0 CHECK (pageants_used >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (ends_at IS NULL OR ends_at > starts_at)
);

CREATE UNIQUE INDEX uq_one_active_subscription_per_org
ON organization_subscriptions(organization_id)
WHERE status IN ('TRIALING', 'ACTIVE', 'PAST_DUE', 'PAUSED');

CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    subscription_id UUID REFERENCES organization_subscriptions(id) ON DELETE SET NULL,
    provider VARCHAR(50),
    provider_transaction_id TEXT,
    amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
    currency CHAR(3) NOT NULL DEFAULT 'PHP',
    status payment_status NOT NULL DEFAULT 'PENDING',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (provider, provider_transaction_id)
);

CREATE TRIGGER trg_subscription_plans_updated_at
BEFORE UPDATE ON subscription_plans
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_organization_subscriptions_updated_at
BEFORE UPDATE ON organization_subscriptions
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_payment_transactions_updated_at
BEFORE UPDATE ON payment_transactions
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

INSERT INTO subscription_plans
(code, name, kind, price_amount, currency, billing_interval_months, max_pageants, max_tabulator_users, customization_enabled)
VALUES
('PER_EVENT', 'Per Event', 'PER_EVENT', 500.00, 'PHP', NULL, 1, 1, FALSE),
('MONTHLY', 'Monthly', 'MONTHLY', 1500.00, 'PHP', 1, 5, 2, TRUE),
('YEARLY', 'Yearly', 'YEARLY', 15000.00, 'PHP', 12, 60, 2, TRUE)
ON CONFLICT (code) DO NOTHING;
