-- Organization owners can view, edit, and archive their pageants.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'ORG_OWNER'
  AND r.scope = 'ORGANIZATION'::role_scope
  AND p.code IN ('pageant.read', 'pageant.update', 'pageant.delete')
ON CONFLICT (role_id, permission_id) DO NOTHING;
