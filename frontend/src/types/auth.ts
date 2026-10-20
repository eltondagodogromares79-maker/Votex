/**
 * Auth / Identity types.
 *
 * Source of truth: backend/core_auth/src/
 *   domain/models/user.rs
 *   contracts/login.rs
 *   contracts/registration.rs
 *   contracts/profile.rs
 *
 * The HTTP client (src/lib/api/client.ts) converts:
 *   Outbound: camelCase → snake_case
 *   Inbound:  snake_case → camelCase
 *
 * So all types here use camelCase. Timestamps are RFC 3339. UUIDs are strings.
 */

export type { BackendRole, FrontendRole } from "@/src/lib/auth/roles";

// ─── Enums ────────────────────────────────────────────────────────────────────

/**
 * user.rs UserAccountStatus.
 * Serde: no rename_all → serialised as Rust PascalCase variant names.
 */
export type UserAccountStatus = "Pending" | "Active" | "Suspended" | "Deactivated";

// ─── Domain model ─────────────────────────────────────────────────────────────

/**
 * domain/models/user.rs User struct.
 * password_hash is never serialised by the backend.
 */
export interface User {
  id: string;
  email: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  phone: string | null;
  profileImageUrl: string | null;
  status: UserAccountStatus;
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  failedLoginAttempts: number;
  failedLoginWindowStartedAt: string | null;
  lockedUntil: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── API contracts ────────────────────────────────────────────────────────────

/** POST /api/v1/auth/register/organization — request body */
export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  phone: string | null;
  orgName: string;
  orgSlug: string;
  orgDescription: string | null;
  orgEmail: string | null;
  orgPhone: string | null;
  orgAddress: string | null;
}

/** POST /api/v1/auth/register/organization and /audience — response (HTTP 201) */
export interface RegisterResponse {
  userId: string;
  email: string;
  message: string;
}

/** POST /api/v1/auth/login — request body */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * POST /api/v1/auth/login — response (HTTP 200).
 * Matches contracts/login.rs LoginResponse.
 * Refresh token is in an HttpOnly cookie, not in the body.
 */
export interface LoginResponse {
  userId: string;
  accessToken: string;
  tokenType: string;
  expiresIn: number; // i64 seconds
}

/**
 * GET /api/v1/auth/me — response (HTTP 200).
 * Matches contracts/profile.rs ProfileResponse.
 */
export interface MeResponse {
  userId: string;
  email: string;
  pendingEmail: string | null;
  emailVerifiedAt: string | null;
  firstName: string;
  middleName: string | null;
  lastName: string;
  phone: string | null;
  profileImageUrl: string | null;
  mustChangePassword: boolean;
}

/**
 * PUT /api/v1/auth/me — request body.
 * Matches contracts/profile.rs UpdateProfileRequest.
 */
export interface UpdateProfileRequest {
  firstName: string;
  middleName: string | null;
  lastName: string;
  phone: string | null;
  profileImageUrl: string | null;
}

/**
 * POST /api/v1/auth/refresh — response (HTTP 200).
 * Matches contracts/login.rs RefreshTokenResponse.
 */
export interface RefreshResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number; // i64 seconds
}

/** POST /api/v1/auth/logout — response. Matches contracts/login.rs LogoutResponse. */
export interface LogoutResponse {
  message: string;
}

/**
 * POST /api/v1/auth/verify-email — request body.
 * Matches contracts/registration.rs VerifyEmailRequest.
 */
export interface VerifyEmailRequest {
  email: string;
  code: string; // exactly 6 digits
}

/**
 * PUT /api/v1/auth/me/password — request body.
 * Matches contracts/change_password.rs ChangePasswordRequest.
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/**
 * Backend error envelope — portals/core_infra/src/errors/response.rs ErrorResponse.
 * errorId is omitted entirely (not null) when absent.
 */
export interface ApiErrorBody {
  code: string;       // e.g. "VALIDATION_ERROR", "EMAIL_TAKEN"
  message: string;
  errorId?: string;   // only present for internal server errors
}

// ─── Frontend session state ───────────────────────────────────────────────────

import type { BackendRole, FrontendRole } from "@/src/lib/auth/roles";

/** Authenticated user held in client-side context. Not a backend model. */
export interface AuthUser {
  userId: string;
  email: string;
  role: FrontendRole;
}
