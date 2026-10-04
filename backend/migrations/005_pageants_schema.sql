-- VoteX - 005 Pageants
CREATE TYPE pageant_status AS ENUM ('DRAFT', 'PUBLISHED', 'ONGOING', 'COMPLETED', 'CANCELLED', 'ARCHIVED');
CREATE TYPE score_visibility AS ENUM ('PRIVATE', 'TABULATOR_ONLY', 'PUBLISHED');

CREATE TABLE pageants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    name VARCHAR(200) NOT NULL,
    slug CITEXT NOT NULL,
    description TEXT,
    logo_url TEXT,
    event_date DATE,
    start_time TIME,
    end_time TIME,
    venue TEXT,
    status pageant_status NOT NULL DEFAULT 'DRAFT',
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (organization_id, slug)
);

CREATE TABLE pageant_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pageant_id UUID NOT NULL UNIQUE REFERENCES pageants(id) ON DELETE CASCADE,
    allow_public_viewing BOOLEAN NOT NULL DEFAULT FALSE,
    allow_public_voting BOOLEAN NOT NULL DEFAULT FALSE,
    require_contestant_photos BOOLEAN NOT NULL DEFAULT FALSE,
    allow_late_score_submission BOOLEAN NOT NULL DEFAULT FALSE,
    score_visibility score_visibility NOT NULL DEFAULT 'PRIVATE',
    voting_starts_at TIMESTAMPTZ,
    voting_ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (voting_ends_at IS NULL OR voting_starts_at IS NULL OR voting_ends_at > voting_starts_at)
);

CREATE INDEX idx_pageants_organization_id ON pageants(organization_id);
CREATE INDEX idx_pageants_status ON pageants(status);

ALTER TABLE pageant_member_roles
    ADD CONSTRAINT fk_pageant_member_roles_pageant
    FOREIGN KEY (pageant_id) REFERENCES pageants(id) ON DELETE CASCADE;

CREATE TRIGGER trg_pageants_updated_at
BEFORE UPDATE ON pageants
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_pageant_settings_updated_at
BEFORE UPDATE ON pageant_settings
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
