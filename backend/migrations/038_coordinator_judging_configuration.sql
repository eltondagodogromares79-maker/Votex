-- Coordinator judging configuration and inclusive category eligibility.
-- Existing categories remain available to every division until an organizer
-- explicitly selects a narrower eligibility scope.
ALTER TABLE pageant_categories
    ADD COLUMN eligibility_scope VARCHAR(24) NOT NULL DEFAULT 'OPEN',
    ADD COLUMN eligibility_notes TEXT;

ALTER TABLE pageant_categories
    ADD CONSTRAINT pageant_categories_eligibility_scope_check
    CHECK (eligibility_scope IN ('OPEN', 'WOMEN', 'MEN', 'LGBTQ_PLUS', 'CUSTOM'));

CREATE TABLE pageant_round_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pageant_id UUID NOT NULL REFERENCES pageants(id) ON DELETE CASCADE,
    round_id UUID NOT NULL REFERENCES pageant_rounds(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES pageant_categories(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (round_id, category_id)
);

-- Keep existing category assignments represented in the new round/category
-- map wherever they already appear in round_criteria.
INSERT INTO pageant_round_categories (pageant_id, round_id, category_id)
SELECT DISTINCT rounds.pageant_id, rc.round_id, rc.category_id
FROM round_criteria rc
JOIN pageant_rounds rounds ON rounds.id = rc.round_id
WHERE rc.category_id IS NOT NULL
ON CONFLICT (round_id, category_id) DO NOTHING;

CREATE INDEX idx_pageant_round_categories_round ON pageant_round_categories(round_id);
CREATE INDEX idx_pageant_round_categories_category ON pageant_round_categories(category_id);

CREATE OR REPLACE FUNCTION validate_pageant_round_category()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    round_pageant UUID;
    category_pageant UUID;
BEGIN
    SELECT pageant_id INTO round_pageant FROM pageant_rounds WHERE id = NEW.round_id;
    SELECT pageant_id INTO category_pageant FROM pageant_categories WHERE id = NEW.category_id;
    IF round_pageant IS NULL OR category_pageant IS NULL
       OR round_pageant <> NEW.pageant_id OR category_pageant <> NEW.pageant_id THEN
        RAISE EXCEPTION 'round category must reference a round and category from the same pageant';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_pageant_round_category
BEFORE INSERT OR UPDATE ON pageant_round_categories
FOR EACH ROW EXECUTE FUNCTION validate_pageant_round_category();

CREATE OR REPLACE FUNCTION validate_round_criterion_assignment()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    round_pageant UUID;
    criterion_pageant UUID;
    category_pageant UUID;
BEGIN
    SELECT pageant_id INTO round_pageant FROM pageant_rounds WHERE id = NEW.round_id;
    SELECT pageant_id INTO criterion_pageant FROM criteria WHERE id = NEW.criterion_id;
    IF round_pageant IS NULL OR criterion_pageant IS NULL OR round_pageant <> criterion_pageant THEN
        RAISE EXCEPTION 'round and criterion must belong to the same pageant';
    END IF;
    IF NEW.category_id IS NOT NULL THEN
        SELECT pageant_id INTO category_pageant FROM pageant_categories WHERE id = NEW.category_id;
        IF category_pageant IS NULL OR category_pageant <> round_pageant THEN
            RAISE EXCEPTION 'round criterion category must belong to the same pageant';
        END IF;
        IF NOT EXISTS (
            SELECT 1 FROM pageant_round_categories
            WHERE round_id = NEW.round_id AND category_id = NEW.category_id
        ) THEN
            RAISE EXCEPTION 'category must be assigned to the round before its criterion';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_round_criterion_assignment
BEFORE INSERT OR UPDATE ON round_criteria
FOR EACH ROW EXECUTE FUNCTION validate_round_criterion_assignment();
