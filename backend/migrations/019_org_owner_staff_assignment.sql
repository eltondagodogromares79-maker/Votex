-- Organization owners can assign judge and tabulator roles to pageants
-- belonging to their organization.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'ORG_OWNER'
  AND r.scope = 'ORGANIZATION'::role_scope
  AND p.code IN ('judge.assign', 'tabulator.assign')
ON CONFLICT (role_id, permission_id) DO NOTHING;
