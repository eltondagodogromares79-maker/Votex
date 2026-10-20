-- Let organization owners inspect their own organization's activity history.
INSERT INTO role_permissions (role_id, permission_id)
SELECT role.id, permission.id
FROM roles role
CROSS JOIN permissions permission
WHERE role.code = 'ORG_OWNER'
  AND permission.code = 'audit.read'
ON CONFLICT (role_id, permission_id) DO NOTHING;
