-- VoteX - 011 Audience Voting
CREATE TYPE voting_status AS ENUM ('DRAFT', 'OPEN', 'CLOSED', 'SUSPENDED', 'FINALIZED');
CREATE TYPE audience_vote_status AS ENUM ('PENDING', 'VALID', 'INVALID', 'REVERSED', 'REVIEW');

CREATE TABLE voting_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pageant_id UUID NOT NULL REFERENCES pageants(id) ON DELETE CASCADE,
    round_id UUID REFERENCES pageant_rounds(id) ON DELETE CASCADE,
    status voting_status NOT NULL DEFAULT 'DRAFT',
    vote_limit_per_voter INTEGER CHECK (vote_limit_per_voter IS NULL OR vote_limit_per_voter > 0),
    vote_limit_per_contestant INTEGER CHECK (vote_limit_per_contestant IS NULL OR vote_limit_per_contestant > 0),
    weight_percentage NUMERIC(7,4) NOT NULL DEFAULT 0 CHECK (weight_percentage >= 0 AND weight_percentage <= 100),
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    verification_required BOOLEAN NOT NULL DEFAULT FALSE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at)
);

CREATE TABLE audience_voters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES users(id) ON DELETE CASCADE,

    voter_identity_hash TEXT NOT NULL UNIQUE,

    verification_status VARCHAR(30) NOT NULL DEFAULT 'UNVERIFIED',

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (user_id)
);

CREATE TABLE audience_vote_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voting_configuration_id UUID NOT NULL REFERENCES voting_configurations(id) ON DELETE RESTRICT,
    contestant_id UUID NOT NULL REFERENCES contestants(id) ON DELETE RESTRICT,
    audience_voter_id UUID REFERENCES audience_voters(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    status audience_vote_status NOT NULL DEFAULT 'PENDING',
    idempotency_key TEXT NOT NULL,
    request_id UUID,
    invalid_reason TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    verified_at TIMESTAMPTZ,
    UNIQUE (voting_configuration_id, idempotency_key)
);

CREATE TABLE audience_vote_totals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voting_configuration_id UUID NOT NULL REFERENCES voting_configurations(id) ON DELETE CASCADE,
    contestant_id UUID NOT NULL REFERENCES contestants(id) ON DELETE CASCADE,
    total_votes BIGINT NOT NULL DEFAULT 0 CHECK (total_votes >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (voting_configuration_id, contestant_id)
);

CREATE INDEX idx_voting_configurations_pageant ON voting_configurations(pageant_id);
CREATE INDEX idx_vote_transactions_contestant ON audience_vote_transactions(contestant_id);
CREATE INDEX idx_vote_transactions_status ON audience_vote_transactions(status);

CREATE TRIGGER trg_voting_configurations_updated_at
BEFORE UPDATE ON voting_configurations
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
