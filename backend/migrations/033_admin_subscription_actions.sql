CREATE TABLE subscription_admin_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES organization_subscriptions(id) ON DELETE CASCADE,
    payment_transaction_id UUID REFERENCES payment_transactions(id) ON DELETE SET NULL,
    proof_id UUID REFERENCES subscription_payment_proofs(id) ON DELETE SET NULL,
    admin_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(40) NOT NULL CHECK (action IN (
        'APPROVE_PAYMENT', 'REJECT_PAYMENT', 'REVOKE_APPROVAL', 'CANCEL_SUBSCRIPTION'
    )),
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscription_admin_actions_subscription
    ON subscription_admin_actions(subscription_id, created_at DESC);
