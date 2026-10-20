-- Contestant numbers are division-specific: Male #1 and Female #1 can coexist.
ALTER TABLE contestants
    DROP CONSTRAINT IF EXISTS contestants_pageant_id_contestant_number_key;

CREATE UNIQUE INDEX IF NOT EXISTS uq_contestants_pageant_number_gender
    ON contestants (pageant_id, contestant_number, COALESCE(LOWER(BTRIM(gender)), ''));
