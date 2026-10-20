ALTER TABLE users
    ADD COLUMN must_change_password BOOLEAN NOT NULL DEFAULT FALSE;

-- Unused staff accounts were created with temporary credentials. Require a
-- password change the next time they sign in.
UPDATE users AS user_account
SET must_change_password = TRUE
WHERE user_account.last_login_at IS NULL
  AND (
      EXISTS (
          SELECT 1
          FROM organization_members member
          JOIN organization_member_roles member_role ON member_role.organization_member_id = member.id
          JOIN roles role ON role.id = member_role.role_id
          WHERE member.user_id = user_account.id
            AND member.is_active = TRUE
            AND role.code = 'ORG_COORDINATOR'
      )
      OR EXISTS (
          SELECT 1
          FROM pageant_member_roles member_role
          JOIN roles role ON role.id = member_role.role_id
          WHERE member_role.user_id = user_account.id
            AND member_role.is_active = TRUE
            AND role.code IN ('PAGEANT_JUDGE', 'PAGEANT_TABULATOR')
      )
  );
