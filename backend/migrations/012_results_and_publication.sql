-- VoteX - 012 Results and Publication
CREATE TYPE result_status AS ENUM ('CALCULATED', 'UNDER_REVIEW', 'TIE_REQUIRES_REVIEW', 'APPROVED', 'PUBLISHED', 'VOIDED');

CREATE TABLE round_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tabulation_run_id UUID NOT NULL REFERENCES tabulation_runs(id) ON DELETE RESTRICT,
    contestant_id UUID NOT NULL REFERENCES contestants(id) ON DELETE RESTRICT,
    total_score NUMERIC(12,5) NOT NULL CHECK (total_score >= 0),
    judge_score NUMERIC(12,5) NOT NULL DEFAULT 0 CHECK (judge_score >= 0),
    audience_score NUMERIC(12,5) NOT NULL DEFAULT 0 CHECK (audience_score >= 0),
    rank INTEGER CHECK (rank IS NULL OR rank > 0),
    status result_status NOT NULL DEFAULT 'CALCULATED',
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tabulation_run_id, contestant_id)
);

CREATE TABLE final_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pageant_id UUID NOT NULL REFERENCES pageants(id) ON DELETE CASCADE,
    contestant_id UUID NOT NULL REFERENCES contestants(id) ON DELETE RESTRICT,
    final_rank INTEGER CHECK (final_rank IS NULL OR final_rank > 0),
    final_score NUMERIC(12,5) CHECK (final_score IS NULL OR final_score >= 0),
    award_name VARCHAR(150),
    status result_status NOT NULL DEFAULT 'CALCULATED',
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    published_by UUID REFERENCES users(id) ON DELETE SET NULL,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE result_publications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pageant_id UUID NOT NULL REFERENCES pageants(id) ON DELETE CASCADE,
    publication_version INTEGER NOT NULL CHECK (publication_version > 0),
    published_by UUID REFERENCES users(id) ON DELETE SET NULL,
    published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    public_payload JSONB NOT NULL,
    UNIQUE (pageant_id, publication_version)
);

CREATE INDEX idx_round_results_contestant ON round_results(contestant_id);
CREATE INDEX idx_final_results_pageant ON final_results(pageant_id);
CREATE INDEX idx_final_results_status ON final_results(status);

CREATE TRIGGER trg_final_results_updated_at
BEFORE UPDATE ON final_results
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
