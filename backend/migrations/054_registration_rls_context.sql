-- Allow an unauthenticated registration transaction to create the new owner's
-- organization. The application sets votex.user_id transaction-locally to the
-- server-created user ID immediately before the organization insert.
CREATE POLICY organization_owner_registration_insert ON organizations
    FOR INSERT
    WITH CHECK (owner_id = public.votex_current_user_id());
