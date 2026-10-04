-- VoteX - 013 Audit, Transaction, and Idempotency
CREATE TYPE business_transaction_type AS ENUM (
    'PAYMENT',
    'VOTE',
    'SCORE_SUBMISSION',
    'RESULT_CALCULATION',
    'RESULT_FINALIZATION',
    'SUBSCRIPTION_CHANGE'
);

CREATE TYPE business_transaction_status AS ENUM (
    'PENDING',
    'PROCESSING',
    'COMPLETED',
    'FAILED',
    'REVERSED',
    'CANCELLED'
);

CREATE TYPE idempotency_status AS ENUM ('PROCESSING', 'COMPLETED', 'FAILED');

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    pageant_id UUID REFERENCES pageants(id) ON DELETE SET NULL,
    actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(120) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id UUID,
    before_data JSONB,
    after_data JSONB,
    request_id UUID,
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN NOT NULL DEFAULT TRUE,
    failure_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE transaction_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_type business_transaction_type NOT NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    pageant_id UUID REFERENCES pageants(id) ON DELETE SET NULL,
    actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    reference_type VARCHAR(100),
    reference_id UUID,
    status business_transaction_status NOT NULL DEFAULT 'PENDING',
    amount NUMERIC(12,2) CHECK (amount IS NULL OR amount >= 0),
    currency CHAR(3) DEFAULT 'PHP',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    request_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ
);

CREATE TABLE idempotency_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scope VARCHAR(120) NOT NULL,
    idempotency_key VARCHAR(255) NOT NULL,
    request_hash TEXT NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    pageant_id UUID REFERENCES pageants(id) ON DELETE SET NULL,
    status idempotency_status NOT NULL DEFAULT 'PROCESSING',
    response_status INTEGER,
    response_body JSONB,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    UNIQUE (scope, idempotency_key)
);

CREATE INDEX idx_audit_logs_pageant_created ON audit_logs(pageant_id, created_at DESC);
CREATE INDEX idx_audit_logs_actor_created ON audit_logs(actor_user_id, created_at DESC);
CREATE INDEX idx_transaction_logs_reference ON transaction_logs(reference_type, reference_id);
CREATE INDEX idx_idempotency_expires_at ON idempotency_keys(expires_at);
