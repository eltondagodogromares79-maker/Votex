-- VoteX - 010 Tabulation and Tie Breaks
CREATE TYPE tabulation_run_status AS ENUM ('STARTED', 'COMPLETED', 'FAILED', 'VOIDED');
CREATE TYPE tie_break_rule_type AS ENUM ('CRITERION_SCORE', 'ROUND_SCORE', 'TOTAL_RAW_SCORE', 'ADDITIONAL_ROUND', 'MANUAL_REVIEW');
CREATE TYPE tie_case_status AS ENUM ('OPEN', 'RESOLVED', 'ESCALATED');

CREATE TABLE tabulation_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pageant_id UUID NOT NULL REFERENCES pageants(id) ON DELETE CASCADE,
    round_id UUID NOT NULL REFERENCES pageant_rounds(id) ON DELETE CASCADE,
    run_number INTEGER NOT NULL CHECK (run_number > 0),
    status tabulation_run_status NOT NULL DEFAULT 'STARTED',
    algorithm_version VARCHAR(50) NOT NULL,
    input_hash TEXT,
    initiated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    UNIQUE (round_id, run_number)
);

CREATE TABLE tie_break_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pageant_id UUID NOT NULL REFERENCES pageants(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    rule_type tie_break_rule_type NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (pageant_id, name)
);

CREATE TABLE round_tie_break_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    round_id UUID NOT NULL REFERENCES pageant_rounds(id) ON DELETE CASCADE,
    tie_break_rule_id UUID NOT NULL REFERENCES tie_break_rules(id) ON DELETE RESTRICT,
    priority_order INTEGER NOT NULL CHECK (priority_order > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (round_id, priority_order),
    UNIQUE (round_id, tie_break_rule_id)
);

CREATE TABLE tie_break_rule_criteria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tie_break_rule_id UUID NOT NULL REFERENCES tie_break_rules(id) ON DELETE CASCADE,
    criterion_id UUID NOT NULL REFERENCES criteria(id) ON DELETE RESTRICT,
    priority_order INTEGER NOT NULL CHECK (priority_order > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tie_break_rule_id, priority_order),
    UNIQUE (tie_break_rule_id, criterion_id)
);

CREATE TABLE tie_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tabulation_run_id UUID NOT NULL REFERENCES tabulation_runs(id) ON DELETE RESTRICT,
    contestant_ids JSONB NOT NULL,
    tied_rank INTEGER NOT NULL CHECK (tied_rank > 0),
    status tie_case_status NOT NULL DEFAULT 'OPEN',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at TIMESTAMPTZ
);

CREATE TABLE tie_break_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tie_case_id UUID NOT NULL REFERENCES tie_cases(id) ON DELETE RESTRICT,
    rule_id UUID REFERENCES tie_break_rules(id) ON DELETE SET NULL,
    decision_type VARCHAR(40) NOT NULL,
    selected_contestant_id UUID REFERENCES contestants(id) ON DELETE RESTRICT,
    decision_notes TEXT,
    decided_by UUID REFERENCES users(id) ON DELETE SET NULL,
    decided_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tabulation_runs_round ON tabulation_runs(round_id);
CREATE INDEX idx_tie_cases_run ON tie_cases(tabulation_run_id);
