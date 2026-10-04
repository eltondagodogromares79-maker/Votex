-- VoteX - 007 Categories and Criteria
CREATE TABLE pageant_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pageant_id UUID NOT NULL REFERENCES pageants(id) ON DELETE CASCADE,
    code VARCHAR(80) NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (pageant_id, code),
    UNIQUE (pageant_id, name)
);

ALTER TABLE contestant_categories
    ADD CONSTRAINT fk_contestant_categories_category
    FOREIGN KEY (category_id) REFERENCES pageant_categories(id) ON DELETE CASCADE;

CREATE TABLE criteria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pageant_id UUID NOT NULL REFERENCES pageants(id) ON DELETE CASCADE,
    code VARCHAR(80) NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    default_maximum_score NUMERIC(8,3) NOT NULL DEFAULT 100 CHECK (default_maximum_score > 0),
    default_minimum_score NUMERIC(8,3) NOT NULL DEFAULT 0 CHECK (default_minimum_score >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (pageant_id, code)
);

CREATE INDEX idx_pageant_categories_pageant ON pageant_categories(pageant_id);
CREATE INDEX idx_criteria_pageant ON criteria(pageant_id);

CREATE TRIGGER trg_pageant_categories_updated_at
BEFORE UPDATE ON pageant_categories
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_criteria_updated_at
BEFORE UPDATE ON criteria
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
