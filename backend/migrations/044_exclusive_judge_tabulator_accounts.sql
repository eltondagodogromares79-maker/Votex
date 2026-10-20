-- Each VoteX account has one pageant staff portal role. A single account must
-- not resolve as both judge and tabulator during authentication.
CREATE OR REPLACE FUNCTION enforce_exclusive_judge_tabulator_account_role()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    assigned_role_code TEXT;
    opposite_role_code TEXT;
BEGIN
    IF NEW.is_active IS NOT TRUE THEN
        RETURN NEW;
    END IF;

    SELECT code INTO assigned_role_code
    FROM roles
    WHERE id = NEW.role_id
      AND scope = 'PAGEANT'::role_scope
      AND is_active = TRUE;

    IF assigned_role_code NOT IN ('PAGEANT_JUDGE', 'PAGEANT_TABULATOR') THEN
        RETURN NEW;
    END IF;

    -- Serialize role assignment changes for the same account so concurrent
    -- requests cannot create a conflicting judge/tabulator pair.
    PERFORM pg_advisory_xact_lock(hashtextextended(NEW.user_id::TEXT, 0));

    opposite_role_code := CASE assigned_role_code
        WHEN 'PAGEANT_JUDGE' THEN 'PAGEANT_TABULATOR'
        ELSE 'PAGEANT_JUDGE'
    END;

    IF EXISTS (
        SELECT 1
        FROM pageant_member_roles assignment
        INNER JOIN roles existing_role ON existing_role.id = assignment.role_id
        WHERE assignment.user_id = NEW.user_id
          AND assignment.is_active = TRUE
          AND existing_role.scope = 'PAGEANT'::role_scope
          AND existing_role.is_active = TRUE
          AND existing_role.code = opposite_role_code
    ) THEN
        RAISE EXCEPTION 'An account cannot have both active judge and tabulator assignments; use a different email or remove the existing role.'
            USING ERRCODE = '23514';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_exclusive_judge_tabulator_account_role
BEFORE INSERT OR UPDATE OF user_id, role_id, is_active ON pageant_member_roles
FOR EACH ROW EXECUTE FUNCTION enforce_exclusive_judge_tabulator_account_role();
