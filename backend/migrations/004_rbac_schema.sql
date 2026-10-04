-- VoteX - 004 RBAC
CREATE TYPE role_scope AS ENUM ('SYSTEM', 'ORGANIZATION', 'PAGEANT');

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(120) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    resource VARCHAR(80) NOT NULL,
    action VARCHAR(80) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(80) NOT NULL UNIQUE,
    name VARCHAR(120) NOT NULL,
    description TEXT,
    scope role_scope NOT NULL,
    is_system_defined BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (role_id, permission_id)
);

CREATE TABLE user_system_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, role_id)
);

CREATE TABLE organization_member_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_member_id UUID NOT NULL REFERENCES organization_members(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (organization_member_id, role_id)
);

CREATE TABLE pageant_member_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pageant_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (pageant_id, user_id, role_id)
);

CREATE INDEX idx_user_system_roles_user ON user_system_roles(user_id);
CREATE INDEX idx_org_member_roles_member ON organization_member_roles(organization_member_id);
CREATE INDEX idx_pageant_member_roles_pageant_user ON pageant_member_roles(pageant_id, user_id);

INSERT INTO roles (code, name, scope, description) VALUES
('PLATFORM_ADMIN', 'Platform Administrator', 'SYSTEM', 'Manages the VoteX platform'),
('ORG_OWNER', 'Organization Owner', 'ORGANIZATION', 'Owns and manages an organization'),
('ORG_COORDINATOR', 'Organization Coordinator', 'ORGANIZATION', 'Manages organization operations'),
('ORG_VIEWER', 'Organization Viewer', 'ORGANIZATION', 'Read-only organization access'),
('PAGEANT_COORDINATOR', 'Pageant Coordinator', 'PAGEANT', 'Manages a pageant'),
('PAGEANT_JUDGE', 'Pageant Judge', 'PAGEANT', 'Submits judging scores'),
('PAGEANT_TABULATOR', 'Pageant Tabulator', 'PAGEANT', 'Calculates and reviews results'),
('PAGEANT_VIEWER', 'Pageant Viewer', 'PAGEANT', 'Views pageant information')
ON CONFLICT (code) DO NOTHING;

INSERT INTO permissions (code, name, resource, action) VALUES
('organization.read', 'Read organization', 'organization', 'read'),
('organization.update', 'Update organization', 'organization', 'update'),
('organization.members.manage', 'Manage organization members', 'organization_members', 'manage'),
('billing.read', 'Read billing', 'billing', 'read'),
('billing.manage', 'Manage billing', 'billing', 'manage'),
('pageant.create', 'Create pageants', 'pageant', 'create'),
('pageant.read', 'Read pageants', 'pageant', 'read'),
('pageant.update', 'Update pageants', 'pageant', 'update'),
('pageant.delete', 'Delete pageants', 'pageant', 'delete'),
('pageant.settings.manage', 'Manage pageant settings', 'pageant_settings', 'manage'),
('contestant.create', 'Create contestants', 'contestant', 'create'),
('contestant.read', 'Read contestants', 'contestant', 'read'),
('contestant.update', 'Update contestants', 'contestant', 'update'),
('contestant.delete', 'Delete contestants', 'contestant', 'delete'),
('judge.assign', 'Assign judges', 'judge_assignment', 'assign'),
('tabulator.assign', 'Assign tabulators', 'tabulator_assignment', 'assign'),
('criteria.manage', 'Manage criteria', 'criteria', 'manage'),
('round.manage', 'Manage rounds', 'round', 'manage'),
('advancement.manage', 'Manage candidate advancement', 'advancement', 'manage'),
('score.submit', 'Submit scores', 'score', 'submit'),
('score.read_own', 'Read own scores', 'score', 'read_own'),
('score.read_all', 'Read all scores', 'score', 'read_all'),
('score.correct', 'Correct scores', 'score', 'correct'),
('score.lock', 'Lock scores', 'score', 'lock'),
('results.calculate', 'Calculate results', 'results', 'calculate'),
('results.review', 'Review results', 'results', 'review'),
('results.publish', 'Publish results', 'results', 'publish'),
('voting.manage', 'Manage audience voting', 'voting', 'manage'),
('voting.read', 'Read audience voting', 'voting', 'read'),
('audit.read', 'Read audit logs', 'audit', 'read'),
('transaction.read', 'Read transaction logs', 'transaction', 'read'),
('role.assign', 'Assign roles', 'role', 'assign')
ON CONFLICT (code) DO NOTHING;

CREATE OR REPLACE FUNCTION enforce_role_scope()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    actual_scope role_scope;
BEGIN
    SELECT scope INTO actual_scope FROM roles WHERE id = NEW.role_id;

    IF TG_TABLE_NAME = 'user_system_roles' AND actual_scope <> 'SYSTEM' THEN
        RAISE EXCEPTION 'Role must have SYSTEM scope';
    ELSIF TG_TABLE_NAME = 'organization_member_roles' AND actual_scope <> 'ORGANIZATION' THEN
        RAISE EXCEPTION 'Role must have ORGANIZATION scope';
    ELSIF TG_TABLE_NAME = 'pageant_member_roles' AND actual_scope <> 'PAGEANT' THEN
        RAISE EXCEPTION 'Role must have PAGEANT scope';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_system_role_scope
BEFORE INSERT OR UPDATE ON user_system_roles
FOR EACH ROW EXECUTE FUNCTION enforce_role_scope();

CREATE TRIGGER trg_organization_role_scope
BEFORE INSERT OR UPDATE ON organization_member_roles
FOR EACH ROW EXECUTE FUNCTION enforce_role_scope();

CREATE TRIGGER trg_pageant_role_scope
BEFORE INSERT OR UPDATE ON pageant_member_roles
FOR EACH ROW EXECUTE FUNCTION enforce_role_scope();
