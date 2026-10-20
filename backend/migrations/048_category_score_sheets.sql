-- Keep one score sheet per judge, contestant, and category so categories can
-- be submitted independently within the same round.
ALTER TABLE score_sheets
    ADD COLUMN category_id UUID REFERENCES pageant_categories(id) ON DELETE RESTRICT;

ALTER TABLE score_sheets
    DROP CONSTRAINT IF EXISTS score_sheets_judge_assignment_id_contestant_id_key;

ALTER TABLE score_sheets
    ADD CONSTRAINT uq_score_sheets_assignment_contestant_category
    UNIQUE (judge_assignment_id, contestant_id, category_id);

CREATE INDEX idx_score_sheets_category ON score_sheets(category_id);
