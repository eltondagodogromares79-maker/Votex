CREATE TABLE user_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(40) NOT NULL,
    title VARCHAR(180) NOT NULL,
    message TEXT NOT NULL,
    href TEXT,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_notifications_recipient_created
    ON user_notifications(recipient_user_id, created_at DESC);

CREATE INDEX idx_user_notifications_unread
    ON user_notifications(recipient_user_id, created_at DESC)
    WHERE read_at IS NULL;

CREATE FUNCTION notify_subscription_payment_review() RETURNS trigger AS $$
DECLARE
    organization_owner UUID;
    org_id UUID;
    recipient UUID;
    action_title TEXT;
    action_message TEXT;
BEGIN
    IF TG_OP = 'INSERT' THEN
        SELECT subscription.organization_id INTO org_id
        FROM organization_subscriptions subscription
        WHERE subscription.id = NEW.subscription_id;

        FOR recipient IN
            SELECT system_role.user_id
            FROM user_system_roles system_role
            JOIN roles role ON role.id = system_role.role_id
            WHERE role.code = 'PLATFORM_ADMIN'
        LOOP
            INSERT INTO user_notifications (recipient_user_id, notification_type, title, message, href)
            VALUES (
                recipient,
                'PAYMENT_REVIEW',
                'Payment proof submitted',
                'A new subscription payment proof is waiting for review.',
                '/admin/finance/payment-proofs'
            );
        END LOOP;
        RETURN NEW;
    END IF;

    IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
        RETURN NEW;
    END IF;

    IF NEW.status NOT IN ('APPROVED', 'REJECTED', 'REVOKED') THEN
        RETURN NEW;
    END IF;

    SELECT organization.owner_id, organization.id
      INTO organization_owner, org_id
    FROM organization_subscriptions subscription
    JOIN organizations organization ON organization.id = subscription.organization_id
    WHERE subscription.id = NEW.subscription_id;

    action_title := CASE NEW.status
        WHEN 'APPROVED' THEN 'Subscription payment approved'
        WHEN 'REJECTED' THEN 'Subscription payment rejected'
        ELSE 'Subscription approval revoked'
    END;
    action_message := CASE NEW.status
        WHEN 'APPROVED' THEN 'Your subscription payment was approved.'
        WHEN 'REJECTED' THEN 'Your subscription payment was rejected.'
        ELSE 'The approval for your subscription payment was revoked.'
    END;

    IF NEW.status = 'REJECTED' AND NULLIF(trim(NEW.review_note), '') IS NOT NULL THEN
        action_message := action_message || ' Reason: ' || NEW.review_note;
    ELSIF NEW.status = 'REVOKED' AND NULLIF(trim(NEW.revocation_note), '') IS NOT NULL THEN
        action_message := action_message || ' Reason: ' || NEW.revocation_note;
    END IF;

    IF organization_owner IS NOT NULL THEN
        INSERT INTO user_notifications (recipient_user_id, notification_type, title, message, href)
        VALUES (organization_owner, 'SUBSCRIPTION', action_title, action_message, '/org_owner/billing/subscription');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_notify_admin_new_payment_proof
AFTER INSERT ON subscription_payment_proofs
FOR EACH ROW EXECUTE FUNCTION notify_subscription_payment_review();

CREATE TRIGGER trg_notify_owner_payment_review
AFTER UPDATE OF status ON subscription_payment_proofs
FOR EACH ROW EXECUTE FUNCTION notify_subscription_payment_review();

CREATE FUNCTION notify_pageant_staff_assignment() RETURNS trigger AS $$
DECLARE
    event_name TEXT;
    role_code TEXT;
    target_href TEXT;
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.is_active AND NOT NEW.is_active THEN
        SELECT pageant.name, role.code INTO event_name, role_code
        FROM pageants pageant
        JOIN roles role ON role.id = NEW.role_id
        WHERE pageant.id = NEW.pageant_id;

        target_href := CASE role_code
            WHEN 'PAGEANT_JUDGE' THEN '/judge'
            WHEN 'PAGEANT_TABULATOR' THEN '/tabulator'
            WHEN 'PAGEANT_COORDINATOR' THEN '/coordinator'
            ELSE '/'
        END;

        INSERT INTO user_notifications (recipient_user_id, notification_type, title, message, href)
        VALUES (
            NEW.user_id,
            'PAGEANT_ASSIGNMENT',
            'Pageant assignment ended',
            'Your assignment to ' || COALESCE(event_name, 'a pageant') || ' has ended.',
            target_href
        );
        RETURN NEW;
    END IF;
    IF NOT NEW.is_active OR (TG_OP = 'UPDATE' AND OLD.is_active) THEN
        RETURN NEW;
    END IF;

    SELECT pageant.name, role.code
      INTO event_name, role_code
    FROM pageants pageant
    JOIN roles role ON role.id = NEW.role_id
    WHERE pageant.id = NEW.pageant_id;

    target_href := CASE role_code
        WHEN 'PAGEANT_JUDGE' THEN '/judge'
        WHEN 'PAGEANT_TABULATOR' THEN '/tabulator'
        WHEN 'PAGEANT_COORDINATOR' THEN '/coordinator'
        ELSE '/'
    END;

    INSERT INTO user_notifications (recipient_user_id, notification_type, title, message, href)
    VALUES (
        NEW.user_id,
        'PAGEANT_ASSIGNMENT',
        'New pageant assignment',
        'You have been assigned to ' || COALESCE(event_name, 'a pageant') || '.',
        target_href
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_notify_pageant_staff_assignment
AFTER INSERT OR UPDATE ON pageant_member_roles
FOR EACH ROW EXECUTE FUNCTION notify_pageant_staff_assignment();

CREATE FUNCTION notify_audience_vote_result() RETURNS trigger AS $$
DECLARE
    voter_user UUID;
    event_title TEXT;
    event_message TEXT;
BEGIN
    IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
        RETURN NEW;
    END IF;
    IF NEW.status NOT IN ('VALID', 'INVALID') THEN
        RETURN NEW;
    END IF;

    SELECT voter.user_id INTO voter_user
    FROM audience_voters voter
    WHERE voter.id = NEW.audience_voter_id;
    IF voter_user IS NULL THEN
        RETURN NEW;
    END IF;

    IF NEW.status = 'VALID' THEN
        event_title := 'Votes confirmed';
        event_message := NEW.quantity::text || ' votes have been confirmed.';
    ELSE
        event_title := 'Vote purchase needs attention';
        event_message := COALESCE(NULLIF(trim(NEW.invalid_reason), ''), 'Your vote purchase was not approved.');
    END IF;

    INSERT INTO user_notifications (recipient_user_id, notification_type, title, message, href)
    VALUES (voter_user, 'VOTE_RESULT', event_title, event_message, '/audience/votes');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_notify_audience_vote_result
AFTER UPDATE OF status ON audience_vote_transactions
FOR EACH ROW EXECUTE FUNCTION notify_audience_vote_result();

CREATE FUNCTION notify_admin_new_organization() RETURNS trigger AS $$
DECLARE
    recipient UUID;
BEGIN
    FOR recipient IN
        SELECT system_role.user_id
        FROM user_system_roles system_role
        JOIN roles role ON role.id = system_role.role_id
        WHERE role.code = 'PLATFORM_ADMIN'
    LOOP
        INSERT INTO user_notifications (recipient_user_id, notification_type, title, message, href)
        VALUES (
            recipient,
            'NEW_ORGANIZATION',
            'New organization registered',
            NEW.name || ' has registered on Votex.',
            '/admin/organizations'
        );
    END LOOP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_notify_admin_new_organization
AFTER INSERT ON organizations
FOR EACH ROW EXECUTE FUNCTION notify_admin_new_organization();
