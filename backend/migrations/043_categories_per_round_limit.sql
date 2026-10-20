-- Subscription category allowances are counted separately inside each round.
ALTER TABLE subscription_plans
    RENAME COLUMN max_categories_per_pageant TO max_categories_per_round;
