-- Vote bundles offered to audiences for a specific pageant.
CREATE TABLE pageant_vote_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pageant_id UUID NOT NULL REFERENCES pageants(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    vote_quantity INTEGER NOT NULL CHECK (vote_quantity > 0),
    price_amount NUMERIC(12, 2) NOT NULL CHECK (price_amount >= 0),
    currency CHAR(3) NOT NULL DEFAULT 'PHP',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (pageant_id, name)
);

CREATE INDEX idx_pageant_vote_packages_pageant_active
    ON pageant_vote_packages(pageant_id, is_active);

CREATE TRIGGER trg_pageant_vote_packages_updated_at
BEFORE UPDATE ON pageant_vote_packages
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
