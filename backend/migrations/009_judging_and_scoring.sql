-- VoteX - 009 Judging and Scoring
CREATE TYPE assignment_status AS ENUM ('ACTIVE', 'INACTIVE', 'REVOKED');
CREATE TYPE score_sheet_status AS ENUM ('DRAFT', 'SUBMITTED', 'LOCKED', 'VOIDED');

CREATE TABLE round_criteria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    round_id UUID NOT NULL REFERENCES pageant_rounds(id) ON DELETE CASCADE,
    criterion_id UUID NOT NULL REFERENCES criteria(id) ON DELETE RESTRICT,
    category_id UUID REFERENCES pageant_categories(id) ON DELETE RESTRICT,
    weight_percentage NUMERIC(7,4) NOT NULL CHECK (weight_percentage > 0 AND weight_percentage <= 100),
    maximum_score NUMERIC(8,3) NOT NULL CHECK (maximum_score > 0),
    minimum_score NUMERIC(8,3) NOT NULL DEFAULT 0 CHECK (minimum_score >= 0),
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (round_id, criterion_id, category_id),
    CHECK (minimum_score <= maximum_score)
);

CREATE TABLE judge_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pageant_id UUID NOT NULL REFERENCES pageants(id) ON DELETE CASCADE,
    round_id UUID NOT NULL REFERENCES pageant_rounds(id) ON DELETE CASCADE,
    judge_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    status assignment_status NOT NULL DEFAULT 'ACTIVE',
    assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (round_id, judge_user_id)
);

CREATE TABLE judge_assignment_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    judge_assignment_id UUID NOT NULL REFERENCES judge_assignments(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES pageant_categories(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (judge_assignment_id, category_id)
);

CREATE TABLE judge_assignment_criteria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    judge_assignment_id UUID NOT NULL REFERENCES judge_assignments(id) ON DELETE CASCADE,
    round_criterion_id UUID NOT NULL REFERENCES round_criteria(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (judge_assignment_id, round_criterion_id)
);

CREATE TABLE score_sheets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    judge_assignment_id UUID NOT NULL REFERENCES judge_assignments(id) ON DELETE RESTRICT,
    contestant_id UUID NOT NULL REFERENCES contestants(id) ON DELETE RESTRICT,
    status score_sheet_status NOT NULL DEFAULT 'DRAFT',
    submitted_at TIMESTAMPTZ,
    locked_at TIMESTAMPTZ,
    voided_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (judge_assignment_id, contestant_id)
);

CREATE TABLE judge_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    score_sheet_id UUID NOT NULL REFERENCES score_sheets(id) ON DELETE RESTRICT,
    round_criterion_id UUID NOT NULL REFERENCES round_criteria(id) ON DELETE RESTRICT,
    raw_score NUMERIC(8,3) NOT NULL CHECK (raw_score >= 0),
    normalized_score NUMERIC(10,5),
    weighted_score NUMERIC(10,5),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (score_sheet_id, round_criterion_id)
);

CREATE TABLE score_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    judge_score_id UUID NOT NULL REFERENCES judge_scores(id) ON DELETE RESTRICT,
    version_number INTEGER NOT NULL CHECK (version_number > 0),
    raw_score NUMERIC(8,3) NOT NULL CHECK (raw_score >= 0),
    changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    change_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (judge_score_id, version_number)
);

CREATE INDEX idx_judge_assignments_round ON judge_assignments(round_id);
CREATE INDEX idx_judge_assignments_judge ON judge_assignments(judge_user_id);
CREATE INDEX idx_score_sheets_contestant ON score_sheets(contestant_id);
CREATE INDEX idx_judge_scores_sheet ON judge_scores(score_sheet_id);

CREATE TRIGGER trg_score_sheets_updated_at
BEFORE UPDATE ON score_sheets
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_judge_scores_updated_at
BEFORE UPDATE ON judge_scores
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
