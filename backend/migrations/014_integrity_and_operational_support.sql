-- VoteX - 014 Integrity and Operational Support

-- Ensure pageant role assignments refer to users who belong to the pageant's organization
-- for operational roles. Contestant accounts may be handled separately by the application.
CREATE OR REPLACE FUNCTION validate_pageant_role_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    role_code_value VARCHAR(80);
    org_id UUID;
    is_member BOOLEAN;
BEGIN
    SELECT code INTO role_code_value FROM roles WHERE id = NEW.role_id;

    IF role_code_value IN ('PAGEANT_COORDINATOR', 'PAGEANT_JUDGE', 'PAGEANT_TABULATOR') THEN
        SELECT p.organization_id
        INTO org_id
        FROM pageants p
        WHERE p.id = NEW.pageant_id;

        SELECT EXISTS (
            SELECT 1
            FROM organization_members om
            WHERE om.organization_id = org_id
              AND om.user_id = NEW.user_id
              AND om.is_active = TRUE
        )
        INTO is_member;

        IF NOT is_member THEN
            RAISE EXCEPTION 'User must be an active organization member for this pageant role';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_pageant_role_assignment
BEFORE INSERT OR UPDATE ON pageant_member_roles
FOR EACH ROW EXECUTE FUNCTION validate_pageant_role_assignment();

-- Validate that a contestant and round belong to the same pageant.
CREATE OR REPLACE FUNCTION validate_candidate_round_pageant()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    contestant_pageant UUID;
    round_pageant UUID;
BEGIN
    SELECT pageant_id INTO contestant_pageant
    FROM contestants
    WHERE id = NEW.contestant_id;

    SELECT pageant_id INTO round_pageant
    FROM pageant_rounds
    WHERE id = NEW.round_id;

    IF contestant_pageant IS NULL OR round_pageant IS NULL OR contestant_pageant <> round_pageant THEN
        RAISE EXCEPTION 'Contestant and round must belong to the same pageant';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_candidate_round_pageant
BEFORE INSERT OR UPDATE ON candidate_rounds
FOR EACH ROW EXECUTE FUNCTION validate_candidate_round_pageant();

-- Validate that a judge assignment references a judge belonging to the same pageant.
CREATE OR REPLACE FUNCTION validate_judge_assignment_pageant()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    round_pageant UUID;
BEGIN
    SELECT pageant_id INTO round_pageant
    FROM pageant_rounds
    WHERE id = NEW.round_id;

    IF round_pageant IS NULL OR round_pageant <> NEW.pageant_id THEN
        RAISE EXCEPTION 'Judge assignment pageant does not match round pageant';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_judge_assignment_pageant
BEFORE INSERT OR UPDATE ON judge_assignments
FOR EACH ROW EXECUTE FUNCTION validate_judge_assignment_pageant();

-- Useful indexes for operational queries.
CREATE INDEX idx_pageants_org_status ON pageants(organization_id, status);
CREATE INDEX idx_rounds_pageant_status ON pageant_rounds(pageant_id, status);
CREATE INDEX idx_candidate_rounds_status ON candidate_rounds(round_id, status);
CREATE INDEX idx_audience_totals_config ON audience_vote_totals(voting_configuration_id);

-- Recommended application-level integrity checks:
-- 1. Criteria weights for each round/category must total 100 before locking.
-- 2. Round criteria must belong to the same pageant as the round and criterion.
-- 3. Judge assignments must be validated against pageant roles.
-- 4. Raw scores must not exceed round_criteria.maximum_score.
-- 5. Submitted or locked score sheets must not be edited without an approved correction workflow.
-- 6. Voting limits must be checked inside a transaction with row locking.
-- 7. Final results must be approved before publication.
-- 8. Audit logs should be append-only for normal application users.
-- 9. Idempotency keys must compare request_hash values on retries.
-- 10. Use database transactions for score submission, vote creation, tabulation, and publication.
