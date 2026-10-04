-- Admin directory access is separated from billing management.
-- This migration is idempotent for installations that already have the permission.

INSERT INTO permissions (code, name, resource, action)
VALUES ('user.read', 'Read user directory', 'user', 'read')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'PLATFORM_ADMIN'
  AND p.code = 'user.read'
ON CONFLICT (role_id, permission_id) DO NOTHING;
