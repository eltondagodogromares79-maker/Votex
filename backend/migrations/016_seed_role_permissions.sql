-- VoteX - 016 Seed Role Permissions
--
-- Seeds the default role -> permission matrix.
--
-- Role scopes:
--   SYSTEM       -> user_system_roles
--   ORGANIZATION -> organization_member_roles
--   PAGEANT      -> pageant_member_roles
--
-- This migration is idempotent.

------------------------------------------------------------
-- ORG_OWNER
------------------------------------------------------------
-- Organization owner manages:
-- - Organization
-- - Organization members
-- - Billing
-- - Voting
-- - Organization role assignment

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'ORG_OWNER'
  AND p.code IN (
      'organization.read',
      'organization.update',
      'organization.members.manage',
      'billing.read',
      'billing.manage',
      'voting.manage',
      'role.assign'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;


------------------------------------------------------------
-- ORG_COORDINATOR
------------------------------------------------------------
-- Organization coordinator manages day-to-day
-- pageant and organization operations.

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'ORG_COORDINATOR'
  AND p.code IN (
      'organization.read',
      'organization.update',
      'organization.members.manage',
      'pageant.create',
      'pageant.read',
      'pageant.update',
      'pageant.delete',
      'pageant.settings.manage',
      'contestant.create',
      'contestant.read',
      'contestant.update',
      'contestant.delete',
      'judge.assign',
      'tabulator.assign',
      'criteria.manage',
      'round.manage',
      'advancement.manage',
      'score.read_all',
      'results.calculate',
      'results.review',
      'results.publish',
      'voting.read',
      'audit.read',
      'transaction.read'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;


------------------------------------------------------------
-- ORG_VIEWER
------------------------------------------------------------
-- Read-only organization access.

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'ORG_VIEWER'
  AND p.code IN (
      'organization.read',
      'pageant.read',
      'contestant.read',
      'voting.read'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;


------------------------------------------------------------
-- PAGEANT_COORDINATOR
------------------------------------------------------------
-- Manages a specific pageant and its operations.

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'PAGEANT_COORDINATOR'
  AND p.code IN (
      'pageant.read',
      'pageant.update',
      'pageant.delete',
      'pageant.settings.manage',
      'contestant.create',
      'contestant.read',
      'contestant.update',
      'contestant.delete',
      'judge.assign',
      'tabulator.assign',
      'criteria.manage',
      'round.manage',
      'advancement.manage',
      'score.read_all',
      'results.calculate',
      'results.review',
      'results.publish',
      'voting.read',
      'audit.read',
      'transaction.read'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;


------------------------------------------------------------
-- PAGEANT_JUDGE
------------------------------------------------------------
-- Judge can view the pageant/contestants and submit
-- and review their own scores.

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'PAGEANT_JUDGE'
  AND p.code IN (
      'pageant.read',
      'contestant.read',
      'score.submit',
      'score.read_own'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;


------------------------------------------------------------
-- PAGEANT_TABULATOR
------------------------------------------------------------
-- Handles score review, correction, locking,
-- calculation, and result review/publication.

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'PAGEANT_TABULATOR'
  AND p.code IN (
      'pageant.read',
      'contestant.read',
      'score.read_all',
      'score.correct',
      'score.lock',
      'results.calculate',
      'results.review',
      'results.publish',
      'audit.read',
      'transaction.read'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;


------------------------------------------------------------
-- PAGEANT_VIEWER
------------------------------------------------------------
-- Read-only access to pageant information and results.

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'PAGEANT_VIEWER'
  AND p.code IN (
      'pageant.read',
      'contestant.read',
      'score.read_all',
      'results.review',
      'voting.read'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;


------------------------------------------------------------
-- PLATFORM_ADMIN
------------------------------------------------------------
-- Platform administrator has system-wide access.

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'PLATFORM_ADMIN'
  AND p.code IN (
      'organization.read',
      'organization.update',
      'organization.members.manage',
      'billing.read',
      'billing.manage',
      'pageant.create',
      'pageant.read',
      'pageant.update',
      'pageant.delete',
      'pageant.settings.manage',
      'contestant.create',
      'contestant.read',
      'contestant.update',
      'contestant.delete',
      'judge.assign',
      'tabulator.assign',
      'criteria.manage',
      'round.manage',
      'advancement.manage',
      'score.submit',
      'score.read_own',
      'score.read_all',
      'score.correct',
      'score.lock',
      'results.calculate',
      'results.review',
      'results.publish',
      'voting.manage',
      'voting.read',
      'audit.read',
      'transaction.read',
      'role.assign'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;