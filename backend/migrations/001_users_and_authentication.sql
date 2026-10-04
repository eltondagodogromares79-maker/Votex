-- VoteX - 001 Users and Authentication

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TYPE user_account_status AS ENUM (
    'PENDING',
    'ACTIVE',
    'SUSPENDED',
    'DEACTIVATED'
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    email CITEXT NOT NULL UNIQUE,

    password_hash TEXT,

    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,

    phone VARCHAR(30),

    profile_image_url TEXT,

    status user_account_status NOT NULL DEFAULT 'ACTIVE',

    email_verified_at TIMESTAMPTZ,

    last_login_at TIMESTAMPTZ,

    failed_login_attempts INTEGER NOT NULL DEFAULT 0
        CHECK (failed_login_attempts >= 0),

    locked_until TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================
-- External Authentication Providers
-- ============================================================
--
-- Currently:
--   Google
--
-- Later we can add:
--   Apple
--   Microsoft
--   etc.
--
-- A user may have:
--   password authentication
--   Google authentication
--   or both.
--

CREATE TABLE user_auth_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    provider VARCHAR(50) NOT NULL,

    provider_subject TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (provider, provider_subject),

    UNIQUE (user_id, provider)
);


-- ============================================================
-- Refresh Tokens
-- ============================================================

CREATE TABLE user_refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    token_hash TEXT NOT NULL UNIQUE,

    issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    last_used_at TIMESTAMPTZ,

    expires_at TIMESTAMPTZ NOT NULL,

    revoked_at TIMESTAMPTZ,

    replaced_by_token_id UUID
        REFERENCES user_refresh_tokens(id)
        ON DELETE SET NULL,

    user_agent TEXT,

    ip_address INET,

    CHECK (expires_at > issued_at),

    CHECK (
        revoked_at IS NULL
        OR revoked_at >= issued_at
    )
);


-- ============================================================
-- Password Reset Tokens
-- ============================================================

CREATE TABLE user_password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    token_hash TEXT NOT NULL UNIQUE,

    expires_at TIMESTAMPTZ NOT NULL,

    used_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================
-- Email Verification
-- ============================================================

CREATE TABLE user_email_verification_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    token_hash TEXT NOT NULL UNIQUE,

    expires_at TIMESTAMPTZ NOT NULL,

    verified_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX idx_users_status
    ON users(status);

CREATE INDEX idx_refresh_tokens_user_id
    ON user_refresh_tokens(user_id);

CREATE INDEX idx_refresh_tokens_expires_at
    ON user_refresh_tokens(expires_at);


-- ============================================================
-- Updated At
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();