-- Keep organization coordinator assignments available for deactivate/reactivate.
ALTER TABLE organization_member_roles
    ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX idx_organization_member_roles_active
    ON organization_member_roles(organization_member_id, is_active);
