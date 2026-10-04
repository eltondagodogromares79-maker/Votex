-- VoteX - 027 Subscription Plan Limits
-- Adds per-pageant operational limits and public voting flag to subscription_plans.
-- All new int columns are nullable (NULL = unlimited / not restricted).

ALTER TABLE subscription_plans
    ADD COLUMN max_judges_per_pageant    INTEGER CHECK (max_judges_per_pageant    IS NULL OR max_judges_per_pageant    > 0),
    ADD COLUMN max_rounds_per_pageant    INTEGER CHECK (max_rounds_per_pageant    IS NULL OR max_rounds_per_pageant    > 0),
    ADD COLUMN max_categories_per_round  INTEGER CHECK (max_categories_per_round  IS NULL OR max_categories_per_round  > 0),
    ADD COLUMN public_voting_enabled     BOOLEAN NOT NULL DEFAULT TRUE;
