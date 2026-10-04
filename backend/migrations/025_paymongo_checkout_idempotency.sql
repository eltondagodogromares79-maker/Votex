-- Durable provider checkout references and request idempotency for payments.
ALTER TABLE payment_transactions
    ADD COLUMN idempotency_key TEXT,
    ADD COLUMN checkout_session_id TEXT,
    ADD COLUMN checkout_url TEXT;

CREATE UNIQUE INDEX uq_payment_transactions_idempotency_key
    ON payment_transactions(idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE UNIQUE INDEX uq_payment_transactions_checkout_session
    ON payment_transactions(checkout_session_id) WHERE checkout_session_id IS NOT NULL;

ALTER TABLE audience_vote_transactions
    DROP CONSTRAINT IF EXISTS audience_vote_transactions_voting_configuration_id_idempotency_key_key,
    ADD COLUMN package_id UUID REFERENCES pageant_vote_packages(id) ON DELETE RESTRICT,
    ADD COLUMN amount NUMERIC(12,2) CHECK (amount IS NULL OR amount >= 0),
    ADD COLUMN currency CHAR(3) NOT NULL DEFAULT 'PHP',
    ADD COLUMN checkout_session_id TEXT,
    ADD COLUMN checkout_url TEXT,
    ADD COLUMN provider_payment_id TEXT,
    ADD COLUMN paid_at TIMESTAMPTZ;

CREATE UNIQUE INDEX uq_audience_vote_voter_idempotency
    ON audience_vote_transactions(audience_voter_id, idempotency_key)
    WHERE audience_voter_id IS NOT NULL;
CREATE UNIQUE INDEX uq_audience_vote_checkout_session
    ON audience_vote_transactions(checkout_session_id)
    WHERE checkout_session_id IS NOT NULL;

CREATE INDEX idx_audience_vote_package ON audience_vote_transactions(package_id);
