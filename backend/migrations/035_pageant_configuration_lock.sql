-- Preserve a pageant slot once an organization starts configuring the event.
-- An untouched draft can be archived and free its slot; configured pageants
-- remain billable even if they were archived before this migration.
ALTER TABLE pageants
    ADD COLUMN configuration_started_at TIMESTAMPTZ;

UPDATE pageants pageant
SET configuration_started_at = now()
WHERE EXISTS (
    SELECT 1 FROM pageant_member_roles assignment
    WHERE assignment.pageant_id = pageant.id
) OR EXISTS (
    SELECT 1 FROM pageant_rounds round
    WHERE round.pageant_id = pageant.id
) OR EXISTS (
    SELECT 1 FROM pageant_categories category
    WHERE category.pageant_id = pageant.id
);

CREATE FUNCTION mark_pageant_configured()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE pageants
    SET configuration_started_at = COALESCE(configuration_started_at, now())
    WHERE id = NEW.pageant_id
      AND status <> 'ARCHIVED'::pageant_status;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'cannot configure an archived or missing pageant';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_pageant_staff_marks_configured
BEFORE INSERT ON pageant_member_roles
FOR EACH ROW EXECUTE FUNCTION mark_pageant_configured();

CREATE TRIGGER trg_pageant_round_marks_configured
BEFORE INSERT ON pageant_rounds
FOR EACH ROW EXECUTE FUNCTION mark_pageant_configured();

CREATE TRIGGER trg_pageant_category_marks_configured
BEFORE INSERT ON pageant_categories
FOR EACH ROW EXECUTE FUNCTION mark_pageant_configured();
