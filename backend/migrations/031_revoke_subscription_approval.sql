ALTER TABLE subscription_payment_proofs
    DROP CONSTRAINT subscription_payment_proofs_status_check,
    ADD CONSTRAINT subscription_payment_proofs_status_check
        CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'REVOKED')),
    ADD COLUMN revoked_by UUID REFERENCES users(id) ON DELETE SET NULL,
    ADD COLUMN revoked_at TIMESTAMPTZ,
    ADD COLUMN revocation_note TEXT;

CREATE INDEX idx_subscription_payment_proofs_history
    ON subscription_payment_proofs(created_at DESC);
