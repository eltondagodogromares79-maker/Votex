CREATE TABLE subscription_payment_proofs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES organization_subscriptions(id) ON DELETE CASCADE,
    payment_transaction_id UUID NOT NULL REFERENCES payment_transactions(id) ON DELETE CASCADE,
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('GCASH', 'MAYA', 'MARIBANK')),
    reference_number VARCHAR(120) NOT NULL,
    proof_url TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    review_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uq_one_pending_payment_proof_per_payment
    ON subscription_payment_proofs(payment_transaction_id)
    WHERE status = 'PENDING';

CREATE INDEX idx_subscription_payment_proofs_review_queue
    ON subscription_payment_proofs(status, created_at DESC);

CREATE TRIGGER trg_subscription_payment_proofs_updated_at
BEFORE UPDATE ON subscription_payment_proofs
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
