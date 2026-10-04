-- VoteX - 008 Rounds and Advancements
CREATE TYPE round_type AS ENUM ('PRELIMINARY', 'SWIMWEAR', 'FORMAL_WEAR', 'TALENT', 'QUESTION_AND_ANSWER', 'FINAL', 'CUSTOM');
CREATE TYPE round_status AS ENUM ('DRAFT', 'OPEN', 'CLOSED', 'FINALIZED');
CREATE TYPE candidate_round_status AS ENUM ('REGISTERED', 'QUALIFIED', 'ADVANCED', 'ELIMINATED', 'WITHDRAWN', 'DISQUALIFIED');

CREATE TABLE pageant_rounds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pageant_id UUID NOT NULL REFERENCES pageants(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    round_number INTEGER NOT NULL CHECK (round_number > 0),
    round_type round_type NOT NULL DEFAULT 'CUSTOM',
    status round_status NOT NULL DEFAULT 'DRAFT',
    advancement_count INTEGER CHECK (advancement_count IS NULL OR advancement_count > 0),
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (pageant_id, round_number),
    UNIQUE (pageant_id, name),
    CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at)
);

CREATE TABLE candidate_rounds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contestant_id UUID NOT NULL REFERENCES contestants(id) ON DELETE CASCADE,
    round_id UUID NOT NULL REFERENCES pageant_rounds(id) ON DELETE CASCADE,
    status candidate_round_status NOT NULL DEFAULT 'REGISTERED',
    qualified_rank INTEGER CHECK (qualified_rank IS NULL OR qualified_rank > 0),
    advanced_at TIMESTAMPTZ,
    eliminated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (contestant_id, round_id)
);

CREATE TABLE advancement_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_round_id UUID NOT NULL REFERENCES pageant_rounds(id) ON DELETE RESTRICT,
    to_round_id UUID NOT NULL REFERENCES pageant_rounds(id) ON DELETE RESTRICT,
    contestant_id UUID NOT NULL REFERENCES contestants(id) ON DELETE RESTRICT,
    decision VARCHAR(30) NOT NULL CHECK (decision IN ('ADVANCED', 'ELIMINATED', 'WITHDRAWN', 'DISQUALIFIED')),
    reason TEXT,
    decided_by UUID REFERENCES users(id) ON DELETE SET NULL,
    decided_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_rounds_pageant ON pageant_rounds(pageant_id);
CREATE INDEX idx_candidate_rounds_round ON candidate_rounds(round_id);
CREATE INDEX idx_candidate_rounds_contestant ON candidate_rounds(contestant_id);

CREATE TRIGGER trg_pageant_rounds_updated_at
BEFORE UPDATE ON pageant_rounds
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_candidate_rounds_updated_at
BEFORE UPDATE ON candidate_rounds
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
