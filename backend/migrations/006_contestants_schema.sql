-- VoteX - 006 Contestants
CREATE TABLE contestants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pageant_id UUID NOT NULL REFERENCES pageants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    contestant_number INTEGER NOT NULL CHECK (contestant_number > 0),
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    display_name VARCHAR(250) NOT NULL,
    gender VARCHAR(50),
    photo_url TEXT,
    biography TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (pageant_id, contestant_number)
);

CREATE TABLE contestant_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contestant_id UUID NOT NULL REFERENCES contestants(id) ON DELETE CASCADE,
    category_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (contestant_id, category_id)
);

CREATE UNIQUE INDEX uq_contestant_pageant_user
ON contestants(pageant_id, user_id)
WHERE user_id IS NOT NULL;

CREATE INDEX idx_contestants_pageant_id ON contestants(pageant_id);
CREATE INDEX idx_contestants_user_id ON contestants(user_id);

CREATE TRIGGER trg_contestants_updated_at
BEFORE UPDATE ON contestants
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
