-- Categories are scoped to a pageant in pageant_categories, not to a round.
ALTER TABLE subscription_plans
    RENAME COLUMN max_categories_per_round TO max_categories_per_pageant;
