CREATE INDEX idx_audience_vote_transactions_voter_created
    ON audience_vote_transactions(audience_voter_id, created_at DESC, id DESC);

CREATE INDEX idx_payment_transactions_org_created
    ON payment_transactions(organization_id, created_at DESC, id DESC);

CREATE INDEX idx_transaction_logs_org_created
    ON transaction_logs(organization_id, created_at DESC, id DESC);
