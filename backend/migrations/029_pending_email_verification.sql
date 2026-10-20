-- Store requested email changes separately until the new address is verified.
ALTER TABLE users
    ADD COLUMN pending_email CITEXT;

-- A verified account cannot have an outstanding address change.
UPDATE users
SET pending_email = NULL
WHERE email_verified_at IS NOT NULL;

CREATE UNIQUE INDEX users_pending_email_unique
    ON users (pending_email)
    WHERE pending_email IS NOT NULL;
