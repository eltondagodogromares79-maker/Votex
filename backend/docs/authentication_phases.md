# VoteX Authentication — Implementation Checklist

## Registration
- [x] Audience registration
- [x] Organization owner registration
- [x] Atomic registration transaction
- [x] Create `users` record
- [x] Create `audience_voters` record during audience registration
- [x] Create `organizations` record during organization-owner registration
- [x] Create `organization_members` record
- [x] Assign `ORG_OWNER` role during organization-owner registration
- [x] Create email verification token

## Password
- [x] Argon2 password hashing
- [x] Password confirmation validation
- [x] Password verification during login
- [x] Password hashes stored instead of plaintext passwords

## Email Verification
- [x] Generate 6-digit verification code
- [x] Hash verification code with HMAC
- [x] Store verification token in database
- [x] Send verification email
- [x] Verify email code
- [x] Prevent verification-token reuse
- [x] Check verification-token expiration
- [x] Update `users.email_verified_at`
- [x] Update verification token `verified_at`
- [x] Update audience voter verification status

## Login
- [x] Login endpoint
- [x] Find user by email
- [x] Verify password
- [x] Check account status
- [x] Check `locked_until`
- [x] Return generic invalid credentials error
- [x] Create authentication session
- [x] Generate refresh token
- [x] Hash refresh token before storing
- [x] Store refresh session in `user_refresh_tokens`

## Login Security
- [x] Check `locked_until`
- [x] Increment `failed_login_attempts`
- [x] Lock account after 5 failed attempts
- [x] Lock duration = 15 minutes
- [x] Reset `failed_login_attempts` after successful login
- [x] Clear `locked_until` after successful login
- [x] Update `last_login_at`

## Access Token / JWT
- [x] Generate access JWT
- [x] Include `sub` (user ID)
- [x] Include `sid` (session ID)
- [x] Include `iat`
- [x] Include `exp`
- [x] Include `iss`
- [x] Include `aud`
- [x] 15-minute access-token lifetime
- [x] HS256 signing
- [x] Validate JWT signature
- [x] Validate JWT expiration
- [x] Validate JWT issuer
- [x] Validate JWT audience
- [x] Extract user ID from JWT
- [x] Extract session ID from JWT

## Authentication Middleware
- [x] Read `Authorization` header
- [x] Require `Bearer` token
- [x] Reject missing token with `401`
- [x] Reject malformed/invalid token with `401`
- [x] Validate JWT through `TokenValidator`
- [x] Create `AuthenticatedUser`
- [x] Attach `AuthenticatedUser` to Actix request extensions
- [x] Protected `/auth/me` endpoint
- [x] Read authenticated user from request extensions

## Refresh Tokens
- [x] Refresh endpoint
- [x] Hash submitted refresh token
- [x] Find refresh session by token hash
- [x] Check refresh-token expiration
- [x] Check revoked status
- [x] Check token replacement status
- [x] Load associated user
- [x] Generate new refresh token
- [x] Rotate refresh token
- [x] Revoke old refresh token
- [x] Link old token to replacement token
- [x] Issue new access JWT


## Logout
- [x] Logout endpoint
- [x] Revoke refresh session
- [x] Make logout idempotent
- [x] Clear refresh-token cookie
- [x] Prevent refresh after logout

## Current Authentication Limitations / Not Implemented
- [ ] Check session database status during every JWT validation
- [ ] Immediately invalidate an existing access JWT after logout
- [ ] Failed-login attempt counting
- [ ] Automatic account lockout
- [ ] Update `last_login_at`
- [ ] Update failed-login counters
- [ ] Session-aware access-token validation
- [ ] Google OAuth login
- [ ] Service-to-service authentication

## Authorization / RBAC
- [ ] Authorization workflow
- [ ] Permission checking
- [ ] System-role authorization
- [ ] Organization-role authorization
- [ ] Pageant-role authorization
- [ ] Authorization middleware
- [ ] `403 Forbidden` handling for insufficient permissions