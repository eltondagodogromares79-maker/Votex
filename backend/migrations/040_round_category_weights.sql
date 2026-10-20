-- Score share for a category within its eligibility group in a round.
-- Existing round assignments start at 100%; coordinators can rebalance them.
ALTER TABLE pageant_round_categories
    ADD COLUMN weight_percentage NUMERIC(7,4) NOT NULL DEFAULT 100
    CHECK (weight_percentage > 0 AND weight_percentage <= 100);
