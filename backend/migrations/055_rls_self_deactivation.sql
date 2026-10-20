-- Account deletion must deactivate every assignment belonging to the caller,
-- including memberships in organizations/pageants they do not manage. Keep
-- this operation narrowly scoped to the request identity and grant no direct
-- cross-tenant update policy to application users.
CREATE OR REPLACE FUNCTION public.votex_deactivate_own_assignments()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    actor UUID := public.votex_current_user_id();
BEGIN
    IF actor IS NULL THEN
        RAISE EXCEPTION 'authenticated user context is required'
            USING ERRCODE = '42501';
    END IF;

    UPDATE public.organization_member_roles member_role
       SET is_active = FALSE
      FROM public.organization_members member
     WHERE member.id = member_role.organization_member_id
       AND member.user_id = actor
       AND member_role.is_active = TRUE;

    UPDATE public.organization_members
       SET is_active = FALSE,
           updated_at = now()
     WHERE user_id = actor
       AND is_active = TRUE;

    UPDATE public.pageant_member_roles
       SET is_active = FALSE
     WHERE user_id = actor
       AND is_active = TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.votex_deactivate_own_assignments() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.votex_deactivate_own_assignments() TO votex_app;
