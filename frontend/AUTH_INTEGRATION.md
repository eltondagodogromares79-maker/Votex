# Auth Integration Design

## Current State Analysis

### Backend
- Returns JWT access tokens + refresh tokens as JSON response body
- Uses Bearer token authentication via `Authorization` header
- No HttpOnly cookie session management
- Missing `/users/me` endpoint
- No Google OAuth implementation
- CORS configured but needs frontend origin setup

### Frontend  
- Expects HttpOnly cookie-based sessions
- In-memory token storage (secure)
- Role hint cookies for middleware route protection
- Calls `/users/me` endpoint that doesn't exist
- Google OAuth UI prepared but not functional

## Design Decisions

### 1. Token Storage Strategy

**Decision: Hybrid approach - HttpOnly cookies for refresh, Bearer tokens for access**

The backend will be modified to:
- **Set HttpOnly, Secure, SameSite=Lax cookie** containing the refresh token on login/refresh
- **Continue returning access tokens in JSON** for in-memory storage (maintains mobile app compatibility)
- **Cookie flags**: `HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=2592000` (30 days)

**Rationale**: 
- Prevents XSS attacks on refresh tokens (most critical)
- Maintains existing mobile app compatibility  
- Frontend can continue in-memory access token storage
- Balances security with practical deployment needs

### 2. Session Verification

**Decision: `/users/me` endpoint + Next.js middleware**

Implementation:
- **New backend endpoint**: `GET /api/v1/users/me` returning `{ id, email, full_name, role }`
- **Frontend middleware**: continues using role hint cookie (`at_hint`) for edge route protection
- **Server-side verification**: middleware forwards cookies to `/users/me` for actual session validation
- **Client-side auth context**: calls `/users/me` after successful login/refresh

**Flow**:
1. Middleware checks `at_hint` cookie for basic route access
2. Protected pages call `/users/me` with HttpOnly cookie to verify actual session
3. Frontend auth context caches user profile from `/users/me` response

### 3. CORS / Same-Origin Plan

**Decision: Cross-origin with explicit CORS configuration**

Current setup:
- **Backend**: `http://192.168.1.11:8000` 
- **Frontend**: `http://localhost:3000`
- **Deployment strategy**: Cross-origin (different ports/hosts)

**Backend CORS configuration**:
```rust
APP_CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

**Cookie requirements**:
- `SameSite=Lax` (not None since no cross-site redirects needed)  
- `Secure=true` (requires HTTPS in production)
- `credentials: "include"` on all frontend fetch calls

### 4. Refresh Flow

**Decision: Automatic refresh with HttpOnly cookie rotation**

**Refresh endpoint behavior**:
- `POST /api/v1/auth/refresh` reads HttpOnly refresh token cookie
- Returns new access token in JSON + sets new HttpOnly refresh token cookie
- **Token rotation**: Old refresh token is invalidated, new one issued
- **Frontend**: Automatic refresh on 401 responses (existing logic maintained)

**Refresh failure handling**:
- Invalid/expired refresh cookie → 401 response
- Frontend clears `at_hint` cookie and redirects to `/login`
- User must re-authenticate

### 5. Role/RBAC Propagation

**Decision: Server-side enforcement with client-side UX hints**

**Backend**: 
- All permission checks remain server-side using existing RBAC system
- `/users/me` endpoint returns user role in response

**Frontend**:
- Role from `/users/me` used for UI gating (show/hide nav items, components)
- `at_hint` cookie used by middleware for route-level access (UX optimization)
- **Security boundary**: Backend RBAC enforcement only - frontend role checks are UX-only

**Role propagation flow**:
1. Login → backend sets `at_hint` cookie with role
2. Frontend calls `/users/me` → gets authoritative role data
3. Frontend auth context caches role for UI decisions
4. All API calls validated server-side regardless of frontend state

### 6. Google OAuth Flow

**Decision: Backend redirect flow with cookie setting**

**Implementation needed**:
- `GET /api/v1/auth/google/start` - Redirect to Google OAuth
- `GET /api/v1/auth/google/callback` - Handle Google callback
- **State parameter**: PKCE/state for CSRF protection
- **Cookie setting**: Callback sets HttpOnly refresh token + redirects to frontend

**OAuth flow**:
1. Frontend button → `window.location.href = "/api/v1/auth/google/start"`
2. Backend redirects to Google OAuth with state/PKCE
3. Google redirects to backend callback with authorization code  
4. Backend exchanges code for tokens, creates user session
5. Backend sets HttpOnly refresh cookie + redirects to frontend success page
6. Frontend detects successful auth and calls `/users/me` to load profile

**Security**:
- **State parameter**: Prevents CSRF attacks on OAuth flow
- **PKCE**: Additional security for public clients
- **Callback URL**: Must match Google OAuth console configuration

## Implementation Order

### Phase 2A - Backend Changes
1. Add `/users/me` endpoint
2. Modify login/refresh endpoints to set HttpOnly cookies  
3. Configure CORS for frontend origin
4. Implement Google OAuth endpoints
5. Update logout to clear cookies

### Phase 2B - Frontend Changes  
1. Update login flow to handle cookie + JSON response
2. Modify auth context to use `/users/me` endpoint
3. Implement Google OAuth button redirect
4. Verify middleware works with new cookie flow
5. Test role-based route protection

### Phase 2C - Cross-verification
1. Confirm cookies sent on all requests (`credentials: "include"`)
2. Test full auth flow: login → protected routes → logout
3. Test Google OAuth end-to-end
4. Test token refresh without user intervention
5. Verify CORS headers and cookie security flags

## Security Considerations

- **HttpOnly cookies**: Prevents XSS access to refresh tokens
- **SameSite=Lax**: Prevents CSRF while allowing normal navigation
- **Secure flag**: Enforces HTTPS in production
- **Token rotation**: Refresh tokens invalidated on each use
- **Server-side RBAC**: All authorization decisions made server-side
- **CORS explicit origins**: No wildcard origins in production
- **OAuth CSRF protection**: State parameter and PKCE flow