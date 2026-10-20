ALTER TABLE pageant_categories
    ADD COLUMN status TEXT NOT NULL DEFAULT 'DRAFT';

ALTER TABLE pageant_categories
    ADD CONSTRAINT pageant_categories_status_check
    CHECK (status IN ('DRAFT', 'OPEN', 'CLOSED', 'COMPLETED'));

-- Preserve current behavior for categories already in active rounds.
UPDATE pageant_categories category
SET status = CASE
    WHEN EXISTS (
        SELECT 1 FROM pageant_round_categories link
        JOIN pageant_rounds round ON round.id = link.round_id
        WHERE link.category_id = category.id AND round.status = 'FINALIZED'::round_status
    ) THEN 'COMPLETED'
    WHEN EXISTS (
        SELECT 1 FROM pageant_round_categories link
        JOIN pageant_rounds round ON round.id = link.round_id
        WHERE link.category_id = category.id AND round.status = 'OPEN'::round_status
    ) THEN 'OPEN'
    WHEN EXISTS (
        SELECT 1 FROM pageant_round_categories link
        JOIN pageant_rounds round ON round.id = link.round_id
        WHERE link.category_id = category.id AND round.status = 'CLOSED'::round_status
    ) THEN 'CLOSED'
    ELSE 'DRAFT'
END;
