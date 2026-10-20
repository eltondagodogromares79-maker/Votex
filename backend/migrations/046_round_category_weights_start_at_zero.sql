-- New categories start unweighted so coordinators must deliberately allocate
-- the category share before opening a round. Existing saved weights are kept.
ALTER TABLE pageant_round_categories
    ALTER COLUMN weight_percentage SET DEFAULT 0;

ALTER TABLE pageant_round_categories
    DROP CONSTRAINT IF EXISTS pageant_round_categories_weight_percentage_check;

ALTER TABLE pageant_round_categories
    ADD CONSTRAINT pageant_round_categories_weight_percentage_check
    CHECK (weight_percentage >= 0 AND weight_percentage <= 100);
