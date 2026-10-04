-- Owners need the same organization-scoped assignment permissions enforced by
-- the judge and tabulator management routes.
INSERT INTO role_permissions (role_id, permission_id)
SELECT role.id, permission.id
FROM roles role
CROSS JOIN permissions permission
WHERE role.code = 'ORG_OWNER'
  AND permission.code IN ('judge.assign', 'tabulator.assign')
ON CONFLICT (role_id, permission_id) DO NOTHING;
