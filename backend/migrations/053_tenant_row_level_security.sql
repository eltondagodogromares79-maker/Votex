-- Tenant isolation at the database layer.
-- The API runtime role must be a non-owner member of votex_app. The migration
-- role owns these functions/tables and is intentionally kept out of runtime.

DO $role$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'votex_app') THEN
        CREATE ROLE votex_app NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE INHERIT NOBYPASSRLS;
    END IF;
END
$role$;

DO $membership$
DECLARE
    runtime_role TEXT := NULLIF(current_setting('votex.runtime_role', TRUE), '');
BEGIN
    IF runtime_role IS NULL OR NOT EXISTS (
        SELECT 1 FROM pg_roles WHERE rolname = runtime_role AND rolcanlogin = TRUE
    ) THEN
        RAISE EXCEPTION 'DATABASE_RUNTIME_ROLE must name an existing login role before applying RLS';
    END IF;
    EXECUTE format('GRANT votex_app TO %I', runtime_role);
END
$membership$;

GRANT USAGE ON SCHEMA public TO votex_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO votex_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO votex_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO votex_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT USAGE, SELECT ON SEQUENCES TO votex_app;

CREATE OR REPLACE FUNCTION public.votex_current_user_id()
RETURNS UUID
LANGUAGE SQL STABLE SECURITY DEFINER
SET search_path = pg_catalog
AS $$
    SELECT NULLIF(current_setting('votex.user_id', TRUE), '')::UUID
$$;

CREATE OR REPLACE FUNCTION public.votex_is_system()
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER
SET search_path = pg_catalog
AS $$
    SELECT COALESCE(NULLIF(current_setting('votex.is_system', TRUE), '')::BOOLEAN, FALSE)
$$;

CREATE OR REPLACE FUNCTION public.votex_is_platform_admin()
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
    SELECT public.votex_is_system()
        OR EXISTS (
            SELECT 1
            FROM public.user_system_roles usr
            JOIN public.roles role ON role.id = usr.role_id
            WHERE usr.user_id = public.votex_current_user_id()
              AND role.code = 'PLATFORM_ADMIN'
              AND role.is_active = TRUE
        )
$$;

CREATE OR REPLACE FUNCTION public.votex_can_access_organization(target_organization UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
    SELECT public.votex_is_platform_admin()
        OR EXISTS (
            SELECT 1 FROM public.organizations organization
            WHERE organization.id = target_organization
              AND organization.owner_id = public.votex_current_user_id()
        )
        OR EXISTS (
            SELECT 1
            FROM public.organization_members member
            WHERE member.organization_id = target_organization
              AND member.user_id = public.votex_current_user_id()
              AND member.is_active = TRUE
        )
$$;

CREATE OR REPLACE FUNCTION public.votex_can_manage_organization(target_organization UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
    SELECT public.votex_is_platform_admin()
        OR EXISTS (
            SELECT 1 FROM public.organizations organization
            WHERE organization.id = target_organization
              AND organization.owner_id = public.votex_current_user_id()
        )
        OR EXISTS (
            SELECT 1
            FROM public.organization_members member
            JOIN public.organization_member_roles member_role
              ON member_role.organization_member_id = member.id
            JOIN public.roles role ON role.id = member_role.role_id
            WHERE member.organization_id = target_organization
              AND member.user_id = public.votex_current_user_id()
              AND member.is_active = TRUE
              AND role.is_active = TRUE
              AND role.code IN ('ORG_OWNER', 'ORG_COORDINATOR')
        )
$$;

CREATE OR REPLACE FUNCTION public.votex_pageant_has_role(target_pageant UUID, allowed_roles TEXT[])
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.pageant_member_roles assignment
        JOIN public.roles role ON role.id = assignment.role_id
        WHERE assignment.pageant_id = target_pageant
          AND assignment.user_id = public.votex_current_user_id()
          AND assignment.is_active = TRUE
          AND role.is_active = TRUE
          AND role.code = ANY(allowed_roles)
    )
$$;

CREATE OR REPLACE FUNCTION public.votex_can_access_pageant(target_pageant UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
    SELECT public.votex_is_platform_admin()
        OR EXISTS (
            SELECT 1 FROM public.pageants pageant
            WHERE pageant.id = target_pageant
              AND public.votex_can_access_organization(pageant.organization_id)
        )
        OR EXISTS (
            SELECT 1 FROM public.pageant_member_roles assignment
            WHERE assignment.pageant_id = target_pageant
              AND assignment.user_id = public.votex_current_user_id()
              AND assignment.is_active = TRUE
        )
$$;

CREATE OR REPLACE FUNCTION public.votex_can_manage_pageant(target_pageant UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
    SELECT public.votex_is_platform_admin()
        OR EXISTS (
            SELECT 1 FROM public.pageants pageant
            WHERE pageant.id = target_pageant
              AND public.votex_can_manage_organization(pageant.organization_id)
        )
        OR public.votex_pageant_has_role(target_pageant, ARRAY['PAGEANT_COORDINATOR'])
$$;

CREATE OR REPLACE FUNCTION public.votex_can_tabulate_pageant(target_pageant UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
    SELECT public.votex_can_manage_pageant(target_pageant)
        OR public.votex_pageant_has_role(target_pageant, ARRAY['PAGEANT_TABULATOR'])
$$;

CREATE OR REPLACE FUNCTION public.votex_is_judge_for_pageant(target_pageant UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
    SELECT public.votex_pageant_has_role(target_pageant, ARRAY['PAGEANT_JUDGE'])
$$;

CREATE OR REPLACE FUNCTION public.votex_pageant_is_public(target_pageant UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.pageants pageant
        WHERE pageant.id = target_pageant
          AND pageant.is_public = TRUE
          AND pageant.status NOT IN ('CANCELLED'::public.pageant_status, 'ARCHIVED'::public.pageant_status)
    )
$$;

CREATE OR REPLACE FUNCTION public.votex_pageant_for_round(target_round UUID)
RETURNS UUID LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = pg_catalog, public AS $$
    SELECT pageant_id FROM public.pageant_rounds WHERE id = target_round
$$;

CREATE OR REPLACE FUNCTION public.votex_pageant_for_contestant(target_contestant UUID)
RETURNS UUID LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = pg_catalog, public AS $$
    SELECT pageant_id FROM public.contestants WHERE id = target_contestant
$$;

CREATE OR REPLACE FUNCTION public.votex_pageant_for_category(target_category UUID)
RETURNS UUID LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = pg_catalog, public AS $$
    SELECT pageant_id FROM public.pageant_categories WHERE id = target_category
$$;

CREATE OR REPLACE FUNCTION public.votex_pageant_for_criterion(target_criterion UUID)
RETURNS UUID LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = pg_catalog, public AS $$
    SELECT pageant_id FROM public.criteria WHERE id = target_criterion
$$;

CREATE OR REPLACE FUNCTION public.votex_pageant_for_assignment(target_assignment UUID)
RETURNS UUID LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = pg_catalog, public AS $$
    SELECT pageant_id FROM public.judge_assignments WHERE id = target_assignment
$$;

CREATE OR REPLACE FUNCTION public.votex_pageant_for_sheet(target_sheet UUID)
RETURNS UUID LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = pg_catalog, public AS $$
    SELECT assignment.pageant_id
    FROM public.score_sheets sheet
    JOIN public.judge_assignments assignment ON assignment.id = sheet.judge_assignment_id
    WHERE sheet.id = target_sheet
$$;

CREATE OR REPLACE FUNCTION public.votex_pageant_for_tabulation_run(target_run UUID)
RETURNS UUID LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = pg_catalog, public AS $$
    SELECT pageant_id FROM public.tabulation_runs WHERE id = target_run
$$;

CREATE OR REPLACE FUNCTION public.votex_pageant_for_tie_case(target_case UUID)
RETURNS UUID LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = pg_catalog, public AS $$
    SELECT run.pageant_id
    FROM public.tie_cases tie_case
    JOIN public.tabulation_runs run ON run.id = tie_case.tabulation_run_id
    WHERE tie_case.id = target_case
$$;

CREATE OR REPLACE FUNCTION public.votex_pageant_for_voting_configuration(target_configuration UUID)
RETURNS UUID LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = pg_catalog, public AS $$
    SELECT pageant_id FROM public.voting_configurations WHERE id = target_configuration
$$;

CREATE OR REPLACE FUNCTION public.votex_add_vote_total(target_vote_transaction UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    vote_configuration UUID;
    vote_contestant UUID;
    vote_quantity INTEGER;
    vote_owner UUID;
BEGIN
    SELECT vote_row.voting_configuration_id, vote_row.contestant_id,
           vote_row.quantity, voter.user_id
      INTO vote_configuration, vote_contestant, vote_quantity, vote_owner
    FROM public.audience_vote_transactions vote_row
    LEFT JOIN public.audience_voters voter ON voter.id = vote_row.audience_voter_id
    WHERE vote_row.id = target_vote_transaction
      AND vote_row.status = 'VALID';

    IF NOT FOUND OR NOT (
        public.votex_is_system()
        OR public.votex_is_platform_admin()
        OR vote_owner = public.votex_current_user_id()
    ) THEN
        RAISE EXCEPTION 'vote total update is not authorized' USING ERRCODE = '42501';
    END IF;

    INSERT INTO public.audience_vote_totals(voting_configuration_id, contestant_id, total_votes)
    VALUES (vote_configuration, vote_contestant, vote_quantity)
    ON CONFLICT (voting_configuration_id, contestant_id)
    DO UPDATE SET total_votes = public.audience_vote_totals.total_votes + EXCLUDED.total_votes,
                  updated_at = now();
END
$$;

CREATE OR REPLACE FUNCTION public.votex_organization_for_subscription(target_subscription UUID)
RETURNS UUID LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = pg_catalog, public AS $$
    SELECT organization_id FROM public.organization_subscriptions WHERE id = target_subscription
$$;

REVOKE ALL ON FUNCTION public.votex_current_user_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.votex_is_system() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.votex_is_platform_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.votex_can_access_organization(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.votex_can_manage_organization(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.votex_pageant_has_role(UUID, TEXT[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.votex_can_access_pageant(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.votex_can_manage_pageant(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.votex_can_tabulate_pageant(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.votex_is_judge_for_pageant(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.votex_pageant_is_public(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.votex_pageant_for_round(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.votex_pageant_for_contestant(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.votex_pageant_for_category(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.votex_pageant_for_criterion(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.votex_pageant_for_assignment(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.votex_pageant_for_sheet(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.votex_pageant_for_tabulation_run(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.votex_pageant_for_tie_case(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.votex_pageant_for_voting_configuration(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.votex_add_vote_total(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.votex_organization_for_subscription(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.votex_current_user_id() TO votex_app;
GRANT EXECUTE ON FUNCTION public.votex_is_system() TO votex_app;
GRANT EXECUTE ON FUNCTION public.votex_is_platform_admin() TO votex_app;
GRANT EXECUTE ON FUNCTION public.votex_can_access_organization(UUID) TO votex_app;
GRANT EXECUTE ON FUNCTION public.votex_can_manage_organization(UUID) TO votex_app;
GRANT EXECUTE ON FUNCTION public.votex_pageant_has_role(UUID, TEXT[]) TO votex_app;
GRANT EXECUTE ON FUNCTION public.votex_can_access_pageant(UUID) TO votex_app;
GRANT EXECUTE ON FUNCTION public.votex_can_manage_pageant(UUID) TO votex_app;
GRANT EXECUTE ON FUNCTION public.votex_can_tabulate_pageant(UUID) TO votex_app;
GRANT EXECUTE ON FUNCTION public.votex_is_judge_for_pageant(UUID) TO votex_app;
GRANT EXECUTE ON FUNCTION public.votex_pageant_is_public(UUID) TO votex_app;
GRANT EXECUTE ON FUNCTION public.votex_pageant_for_round(UUID) TO votex_app;
GRANT EXECUTE ON FUNCTION public.votex_pageant_for_contestant(UUID) TO votex_app;
GRANT EXECUTE ON FUNCTION public.votex_pageant_for_category(UUID) TO votex_app;
GRANT EXECUTE ON FUNCTION public.votex_pageant_for_criterion(UUID) TO votex_app;
GRANT EXECUTE ON FUNCTION public.votex_pageant_for_assignment(UUID) TO votex_app;
GRANT EXECUTE ON FUNCTION public.votex_pageant_for_sheet(UUID) TO votex_app;
GRANT EXECUTE ON FUNCTION public.votex_pageant_for_tabulation_run(UUID) TO votex_app;
GRANT EXECUTE ON FUNCTION public.votex_pageant_for_tie_case(UUID) TO votex_app;
GRANT EXECUTE ON FUNCTION public.votex_pageant_for_voting_configuration(UUID) TO votex_app;
GRANT EXECUTE ON FUNCTION public.votex_add_vote_total(UUID) TO votex_app;
GRANT EXECUTE ON FUNCTION public.votex_organization_for_subscription(UUID) TO votex_app;

-- Organizations and membership assignments.
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY organization_tenant_read ON organizations FOR SELECT
    USING (public.votex_can_access_organization(id));
CREATE POLICY organization_tenant_write ON organizations FOR ALL
    USING (public.votex_can_manage_organization(id))
    WITH CHECK (public.votex_can_manage_organization(id));

ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY organization_member_tenant_read ON organization_members FOR SELECT
    USING (public.votex_can_access_organization(organization_id));
CREATE POLICY organization_member_tenant_write ON organization_members FOR ALL
    USING (public.votex_can_manage_organization(organization_id))
    WITH CHECK (public.votex_can_manage_organization(organization_id));

ALTER TABLE organization_member_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY organization_member_role_tenant_read ON organization_member_roles FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.organization_members member
        WHERE member.id = organization_member_id
          AND public.votex_can_access_organization(member.organization_id)
    ));
CREATE POLICY organization_member_role_tenant_write ON organization_member_roles FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.organization_members member
        WHERE member.id = organization_member_id
          AND public.votex_can_manage_organization(member.organization_id)
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.organization_members member
        WHERE member.id = organization_member_id
          AND public.votex_can_manage_organization(member.organization_id)
    ));

-- Pageants: public reads remain available only for public, non-cancelled events.
ALTER TABLE pageants ENABLE ROW LEVEL SECURITY;
CREATE POLICY pageant_tenant_read ON pageants FOR SELECT
    USING (public.votex_can_access_pageant(id) OR public.votex_pageant_is_public(id));
CREATE POLICY pageant_tenant_write ON pageants FOR ALL
    USING (public.votex_can_manage_pageant(id))
    WITH CHECK (public.votex_can_manage_organization(organization_id));

ALTER TABLE pageant_member_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY pageant_member_role_read ON pageant_member_roles FOR SELECT
    USING (public.votex_can_access_pageant(pageant_id));
CREATE POLICY pageant_member_role_write ON pageant_member_roles FOR ALL
    USING (public.votex_can_manage_pageant(pageant_id))
    WITH CHECK (public.votex_can_manage_pageant(pageant_id));

ALTER TABLE pageant_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY pageant_settings_read ON pageant_settings FOR SELECT
    USING (public.votex_can_access_pageant(pageant_id) OR public.votex_pageant_is_public(pageant_id));
CREATE POLICY pageant_settings_write ON pageant_settings FOR ALL
    USING (public.votex_can_manage_pageant(pageant_id))
    WITH CHECK (public.votex_can_manage_pageant(pageant_id));

-- Direct pageant-owned tables.
DO $pageant_tables$
DECLARE
    table_name TEXT;
BEGIN
    FOREACH table_name IN ARRAY ARRAY[
        'contestants', 'pageant_categories', 'criteria', 'pageant_rounds', 'judge_assignments',
        'voting_configurations', 'tabulation_runs', 'tie_break_rules',
        'final_results', 'result_publications', 'pageant_vote_packages',
        'pageant_round_categories'
    ] LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
        EXECUTE format(
            'CREATE POLICY %I ON public.%I FOR SELECT USING (public.votex_can_access_pageant(pageant_id))',
            table_name || '_tenant_read', table_name
        );
        EXECUTE format(
            'CREATE POLICY %I ON public.%I FOR ALL USING (public.votex_can_manage_pageant(pageant_id)) WITH CHECK (public.votex_can_manage_pageant(pageant_id))',
            table_name || '_tenant_write', table_name
        );
    END LOOP;
END
$pageant_tables$;

-- Keep public visibility limited to the public catalog and vote checkout data.
CREATE POLICY public_contestant_catalog_read ON contestants FOR SELECT
    USING (public.votex_pageant_is_public(pageant_id));
CREATE POLICY public_voting_configuration_read ON voting_configurations FOR SELECT
    USING (public.votex_pageant_is_public(pageant_id));
CREATE POLICY public_vote_package_catalog_read ON pageant_vote_packages FOR SELECT
    USING (public.votex_pageant_is_public(pageant_id));

-- Child tables resolve their tenant through the owning pageant record.
DO $pageant_children$
DECLARE
    item RECORD;
    access_expr TEXT;
    manage_expr TEXT;
BEGIN
    FOR item IN SELECT * FROM (VALUES
        ('contestant_categories', 'public.votex_pageant_for_contestant(contestant_id)'),
        ('candidate_rounds', 'public.votex_pageant_for_contestant(contestant_id)'),
        ('advancement_decisions', 'public.votex_pageant_for_round(from_round_id)'),
        ('round_criteria', 'public.votex_pageant_for_round(round_id)'),
        ('judge_assignment_categories', 'public.votex_pageant_for_category(category_id)'),
        ('judge_assignment_criteria', 'public.votex_pageant_for_assignment(judge_assignment_id)'),
        ('score_sheets', 'public.votex_pageant_for_assignment(judge_assignment_id)'),
        ('judge_scores', 'public.votex_pageant_for_sheet(score_sheet_id)'),
        ('score_versions', 'public.votex_pageant_for_sheet((SELECT score_sheet_id FROM public.judge_scores WHERE id = judge_score_id))'),
        ('round_tie_break_rules', 'public.votex_pageant_for_round(round_id)'),
        ('tie_break_rule_criteria', 'public.votex_pageant_for_criterion(criterion_id)'),
        ('tie_cases', 'public.votex_pageant_for_tabulation_run(tabulation_run_id)'),
        ('tie_break_decisions', 'public.votex_pageant_for_tie_case(tie_case_id)'),
        ('round_results', 'public.votex_pageant_for_tabulation_run(tabulation_run_id)')
    ) AS policies(table_name, tenant_expr)
    LOOP
        access_expr := format('public.votex_can_access_pageant(%s)', item.tenant_expr);
        manage_expr := format('public.votex_can_manage_pageant(%s)', item.tenant_expr);

        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', item.table_name);
        EXECUTE format(
            'CREATE POLICY %I ON public.%I FOR SELECT USING (%s)',
            item.table_name || '_tenant_read', item.table_name, access_expr
        );
        EXECUTE format(
            'CREATE POLICY %I ON public.%I FOR ALL USING (%s) WITH CHECK (%s)',
            item.table_name || '_tenant_write', item.table_name, manage_expr, manage_expr
        );
    END LOOP;
END
$pageant_children$;

CREATE POLICY public_contestant_category_catalog_read ON contestant_categories FOR SELECT
    USING (public.votex_pageant_is_public(public.votex_pageant_for_contestant(contestant_id)));

-- Judges can write only their own assigned score sheets and score rows.
DROP POLICY score_sheets_tenant_write ON score_sheets;
CREATE POLICY score_sheets_judge_write ON score_sheets FOR ALL
    USING (
        public.votex_can_manage_pageant(public.votex_pageant_for_assignment(judge_assignment_id))
        OR EXISTS (
            SELECT 1 FROM public.judge_assignments assignment
            WHERE assignment.id = judge_assignment_id
              AND assignment.judge_user_id = public.votex_current_user_id()
              AND assignment.status = 'ACTIVE'
        )
    )
    WITH CHECK (
        public.votex_can_manage_pageant(public.votex_pageant_for_assignment(judge_assignment_id))
        OR EXISTS (
            SELECT 1 FROM public.judge_assignments assignment
            WHERE assignment.id = judge_assignment_id
              AND assignment.judge_user_id = public.votex_current_user_id()
              AND assignment.status = 'ACTIVE'
        )
    );

DROP POLICY judge_scores_tenant_write ON judge_scores;
CREATE POLICY judge_scores_judge_write ON judge_scores FOR ALL
    USING (
        public.votex_can_manage_pageant(public.votex_pageant_for_sheet(score_sheet_id))
        OR EXISTS (
            SELECT 1 FROM public.score_sheets sheet
            JOIN public.judge_assignments assignment ON assignment.id = sheet.judge_assignment_id
            WHERE sheet.id = score_sheet_id
              AND assignment.judge_user_id = public.votex_current_user_id()
              AND assignment.status = 'ACTIVE'
        )
    )
    WITH CHECK (
        public.votex_can_manage_pageant(public.votex_pageant_for_sheet(score_sheet_id))
        OR EXISTS (
            SELECT 1 FROM public.score_sheets sheet
            JOIN public.judge_assignments assignment ON assignment.id = sheet.judge_assignment_id
            WHERE sheet.id = score_sheet_id
              AND assignment.judge_user_id = public.votex_current_user_id()
              AND assignment.status = 'ACTIVE'
        )
    );

DROP POLICY score_versions_tenant_write ON score_versions;
CREATE POLICY score_versions_judge_write ON score_versions FOR ALL
    USING (
        public.votex_can_manage_pageant(public.votex_pageant_for_sheet(
            (SELECT score_sheet_id FROM public.judge_scores WHERE id = judge_score_id)
        ))
        OR EXISTS (
            SELECT 1
            FROM public.judge_scores score
            JOIN public.score_sheets sheet ON sheet.id = score.score_sheet_id
            JOIN public.judge_assignments assignment ON assignment.id = sheet.judge_assignment_id
            WHERE score.id = judge_score_id
              AND assignment.judge_user_id = public.votex_current_user_id()
              AND assignment.status = 'ACTIVE'
        )
    )
    WITH CHECK (
        public.votex_can_manage_pageant(public.votex_pageant_for_sheet(
            (SELECT score_sheet_id FROM public.judge_scores WHERE id = judge_score_id)
        ))
        OR EXISTS (
            SELECT 1
            FROM public.judge_scores score
            JOIN public.score_sheets sheet ON sheet.id = score.score_sheet_id
            JOIN public.judge_assignments assignment ON assignment.id = sheet.judge_assignment_id
            WHERE score.id = judge_score_id
              AND assignment.judge_user_id = public.votex_current_user_id()
              AND assignment.status = 'ACTIVE'
        )
    );

-- Tabulators and pageant managers may maintain tabulation and result rows.
DROP POLICY tabulation_runs_tenant_write ON tabulation_runs;
CREATE POLICY tabulation_runs_tenant_write ON tabulation_runs FOR ALL
    USING (public.votex_can_tabulate_pageant(pageant_id))
    WITH CHECK (public.votex_can_tabulate_pageant(pageant_id));
DROP POLICY tie_cases_tenant_write ON tie_cases;
CREATE POLICY tie_cases_tenant_write ON tie_cases FOR ALL
    USING (public.votex_can_tabulate_pageant(public.votex_pageant_for_tabulation_run(tabulation_run_id)))
    WITH CHECK (public.votex_can_tabulate_pageant(public.votex_pageant_for_tabulation_run(tabulation_run_id)));
DROP POLICY tie_break_decisions_tenant_write ON tie_break_decisions;
CREATE POLICY tie_break_decisions_tenant_write ON tie_break_decisions FOR ALL
    USING (public.votex_can_tabulate_pageant(public.votex_pageant_for_tie_case(tie_case_id)))
    WITH CHECK (public.votex_can_tabulate_pageant(public.votex_pageant_for_tie_case(tie_case_id)));
DROP POLICY round_results_tenant_write ON round_results;
CREATE POLICY round_results_tenant_write ON round_results FOR ALL
    USING (public.votex_can_tabulate_pageant(public.votex_pageant_for_tabulation_run(tabulation_run_id)))
    WITH CHECK (public.votex_can_tabulate_pageant(public.votex_pageant_for_tabulation_run(tabulation_run_id)));

DROP POLICY candidate_rounds_tenant_write ON candidate_rounds;
CREATE POLICY candidate_rounds_tabulator_write ON candidate_rounds FOR ALL
    USING (public.votex_can_tabulate_pageant(public.votex_pageant_for_contestant(contestant_id)))
    WITH CHECK (public.votex_can_tabulate_pageant(public.votex_pageant_for_contestant(contestant_id)));
DROP POLICY advancement_decisions_tenant_write ON advancement_decisions;
CREATE POLICY advancement_decisions_tabulator_write ON advancement_decisions FOR ALL
    USING (public.votex_can_tabulate_pageant(public.votex_pageant_for_round(from_round_id)))
    WITH CHECK (public.votex_can_tabulate_pageant(public.votex_pageant_for_round(from_round_id)));
DROP POLICY final_results_tenant_write ON final_results;
CREATE POLICY final_results_tabulator_write ON final_results FOR ALL
    USING (public.votex_can_tabulate_pageant(pageant_id))
    WITH CHECK (public.votex_can_tabulate_pageant(pageant_id));
DROP POLICY result_publications_tenant_write ON result_publications;
CREATE POLICY result_publications_tabulator_write ON result_publications FOR ALL
    USING (public.votex_can_tabulate_pageant(pageant_id))
    WITH CHECK (public.votex_can_tabulate_pageant(pageant_id));

-- Organization subscriptions and payment records.
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY active_subscription_plans_public_read ON subscription_plans FOR SELECT
    USING (is_active = TRUE OR public.votex_is_platform_admin());
CREATE POLICY subscription_plans_admin_write ON subscription_plans FOR ALL
    USING (public.votex_is_platform_admin())
    WITH CHECK (public.votex_is_platform_admin());

ALTER TABLE organization_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY organization_subscription_read ON organization_subscriptions FOR SELECT
    USING (public.votex_can_access_organization(organization_id));
CREATE POLICY organization_subscription_write ON organization_subscriptions FOR ALL
    USING (public.votex_can_manage_organization(organization_id) OR public.votex_is_system())
    WITH CHECK (public.votex_can_manage_organization(organization_id) OR public.votex_is_system());

ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY payment_transaction_read ON payment_transactions FOR SELECT
    USING (public.votex_can_access_organization(organization_id));
CREATE POLICY payment_transaction_write ON payment_transactions FOR ALL
    USING (public.votex_can_manage_organization(organization_id) OR public.votex_is_system())
    WITH CHECK (public.votex_can_manage_organization(organization_id) OR public.votex_is_system());

ALTER TABLE subscription_payment_proofs ENABLE ROW LEVEL SECURITY;
CREATE POLICY subscription_payment_proof_read ON subscription_payment_proofs FOR SELECT
    USING (public.votex_can_access_organization(public.votex_organization_for_subscription(subscription_id)));
CREATE POLICY subscription_payment_proof_write ON subscription_payment_proofs FOR ALL
    USING (public.votex_can_manage_organization(public.votex_organization_for_subscription(subscription_id)) OR public.votex_is_system())
    WITH CHECK (public.votex_can_manage_organization(public.votex_organization_for_subscription(subscription_id)) OR public.votex_is_system());

ALTER TABLE subscription_admin_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY subscription_admin_actions_read ON subscription_admin_actions FOR SELECT
    USING (public.votex_is_platform_admin()
        OR public.votex_can_access_organization(public.votex_organization_for_subscription(subscription_id)));
CREATE POLICY subscription_admin_actions_write ON subscription_admin_actions FOR ALL
    USING (public.votex_is_platform_admin())
    WITH CHECK (public.votex_is_platform_admin());

-- Notifications are private to their recipient. Trigger functions are
-- SECURITY DEFINER so database-generated notifications can target other users.
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY notification_recipient_access ON user_notifications
    USING (recipient_user_id = public.votex_current_user_id() OR public.votex_is_platform_admin())
    WITH CHECK (recipient_user_id = public.votex_current_user_id() OR public.votex_is_platform_admin() OR public.votex_is_system());
ALTER FUNCTION public.notify_subscription_payment_review() SECURITY DEFINER;
ALTER FUNCTION public.notify_pageant_staff_assignment() SECURITY DEFINER;
ALTER FUNCTION public.notify_audience_vote_result() SECURITY DEFINER;
ALTER FUNCTION public.notify_admin_new_organization() SECURITY DEFINER;
ALTER FUNCTION public.notify_subscription_payment_review() SET search_path = pg_catalog, public;
ALTER FUNCTION public.notify_pageant_staff_assignment() SET search_path = pg_catalog, public;
ALTER FUNCTION public.notify_audience_vote_result() SET search_path = pg_catalog, public;
ALTER FUNCTION public.notify_admin_new_organization() SET search_path = pg_catalog, public;

-- Auditing, idempotency, audience vote history, and legal/contact workflows.
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_log_read ON audit_logs FOR SELECT
    USING (public.votex_is_platform_admin() OR (organization_id IS NOT NULL AND public.votex_can_access_organization(organization_id)) OR (pageant_id IS NOT NULL AND public.votex_can_access_pageant(pageant_id)));
CREATE POLICY audit_log_insert ON audit_logs FOR INSERT
    WITH CHECK (actor_user_id = public.votex_current_user_id() OR public.votex_is_platform_admin() OR public.votex_is_system());

ALTER TABLE transaction_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY transaction_log_read ON transaction_logs FOR SELECT
    USING (public.votex_is_platform_admin()
        OR actor_user_id = public.votex_current_user_id()
        OR (organization_id IS NOT NULL AND public.votex_can_access_organization(organization_id))
        OR (pageant_id IS NOT NULL AND public.votex_can_access_pageant(pageant_id)));
CREATE POLICY transaction_log_insert ON transaction_logs FOR INSERT
    WITH CHECK (actor_user_id = public.votex_current_user_id() OR public.votex_is_platform_admin() OR public.votex_is_system());
CREATE POLICY transaction_log_system_update ON transaction_logs FOR UPDATE
    USING (public.votex_is_platform_admin() OR public.votex_is_system())
    WITH CHECK (public.votex_is_platform_admin() OR public.votex_is_system());

ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY idempotency_key_access ON idempotency_keys
    USING (public.votex_is_platform_admin()
        OR user_id = public.votex_current_user_id()
        OR (organization_id IS NOT NULL AND public.votex_can_access_organization(organization_id))
        OR (pageant_id IS NOT NULL AND public.votex_can_access_pageant(pageant_id)))
    WITH CHECK (public.votex_is_platform_admin()
        OR user_id = public.votex_current_user_id()
        OR public.votex_is_system());

ALTER TABLE audience_voters ENABLE ROW LEVEL SECURITY;
CREATE POLICY audience_voter_owner_read ON audience_voters FOR SELECT
    USING (user_id = public.votex_current_user_id() OR public.votex_is_platform_admin() OR public.votex_is_system());
CREATE POLICY audience_voter_owner_insert ON audience_voters FOR INSERT
    WITH CHECK (user_id = public.votex_current_user_id() OR public.votex_is_platform_admin() OR public.votex_is_system());
CREATE POLICY audience_voter_owner_update ON audience_voters FOR UPDATE
    USING (user_id = public.votex_current_user_id() OR public.votex_is_platform_admin() OR public.votex_is_system())
    WITH CHECK (user_id = public.votex_current_user_id() OR public.votex_is_platform_admin() OR public.votex_is_system());

ALTER TABLE audience_vote_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY audience_vote_transaction_read ON audience_vote_transactions FOR SELECT
    USING (public.votex_is_platform_admin() OR public.votex_is_system()
        OR EXISTS (SELECT 1 FROM public.audience_voters voter WHERE voter.id = audience_voter_id AND voter.user_id = public.votex_current_user_id())
        OR public.votex_can_access_pageant(public.votex_pageant_for_voting_configuration(voting_configuration_id)));
CREATE POLICY audience_vote_transaction_insert ON audience_vote_transactions FOR INSERT
    WITH CHECK (public.votex_is_system() OR public.votex_is_platform_admin()
        OR EXISTS (SELECT 1 FROM public.audience_voters voter WHERE voter.id = audience_voter_id AND voter.user_id = public.votex_current_user_id()));
CREATE POLICY audience_vote_transaction_update ON audience_vote_transactions FOR UPDATE
    USING (public.votex_is_system() OR public.votex_is_platform_admin()
        OR EXISTS (SELECT 1 FROM public.audience_voters voter WHERE voter.id = audience_voter_id AND voter.user_id = public.votex_current_user_id()))
    WITH CHECK (public.votex_is_system() OR public.votex_is_platform_admin()
        OR EXISTS (SELECT 1 FROM public.audience_voters voter WHERE voter.id = audience_voter_id AND voter.user_id = public.votex_current_user_id()));

ALTER TABLE audience_vote_totals ENABLE ROW LEVEL SECURITY;
CREATE POLICY audience_vote_totals_read ON audience_vote_totals FOR SELECT
    USING (public.votex_can_access_pageant(public.votex_pageant_for_voting_configuration(voting_configuration_id))
        OR public.votex_pageant_is_public(public.votex_pageant_for_voting_configuration(voting_configuration_id)));
CREATE POLICY audience_vote_totals_write ON audience_vote_totals FOR ALL
    USING (public.votex_can_tabulate_pageant(public.votex_pageant_for_voting_configuration(voting_configuration_id)) OR public.votex_is_system() OR public.votex_is_platform_admin())
    WITH CHECK (public.votex_can_tabulate_pageant(public.votex_pageant_for_voting_configuration(voting_configuration_id)) OR public.votex_is_system() OR public.votex_is_platform_admin());

CREATE POLICY public_vote_totals_read ON audience_vote_totals FOR SELECT
    USING (public.votex_pageant_is_public(public.votex_pageant_for_voting_configuration(voting_configuration_id)));

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY contact_message_admin_read ON contact_messages FOR SELECT
    USING (public.votex_is_platform_admin());
CREATE POLICY contact_message_sender_write ON contact_messages FOR INSERT
    WITH CHECK (sender_user_id = public.votex_current_user_id());
CREATE POLICY contact_message_admin_update ON contact_messages FOR UPDATE
    USING (public.votex_is_platform_admin()) WITH CHECK (public.votex_is_platform_admin());

ALTER TABLE legal_policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY legal_policy_public_read ON legal_policies FOR SELECT USING (TRUE);
CREATE POLICY legal_policy_admin_write ON legal_policies FOR ALL
    USING (public.votex_is_platform_admin()) WITH CHECK (public.votex_is_platform_admin());

COMMENT ON SCHEMA public IS 'Tenant RLS policies are enforced for non-owner application sessions using transaction/request context set by the API pool.';
