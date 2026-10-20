    -- Round type labels are pageant-specific and must support organizer-defined values.
-- Preserve existing labels while removing the closed PostgreSQL enum constraint.
ALTER TABLE pageant_rounds
    ALTER COLUMN round_type DROP DEFAULT;

ALTER TABLE pageant_rounds
    ALTER COLUMN round_type TYPE VARCHAR(100)
    USING round_type::text;

ALTER TABLE pageant_rounds
    ADD CONSTRAINT pageant_rounds_round_type_nonempty
    CHECK (length(btrim(round_type)) BETWEEN 1 AND 100);

DROP TYPE round_type;
