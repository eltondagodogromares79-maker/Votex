import { api } from "@/src/lib/api/client";

// ─────────────────────────────────────────────────────────────────────────────
// Auth API — mirrors /api/v1/auth routes in core_auth/src/api/routes/auth.rs
// ─────────────────────────────────────────────────────────────────────────────

export const authApi = {

  // POST /api/v1/auth/register/organization
  registerOrganization: async (data: RegisterOrganizationRequest): Promise<RegisterResponse> => {
    const response = await api.post<RegisterResponse>("/api/v1/auth/register/organization", data);
    return response.data;
  },

  // POST /api/v1/auth/register/audience
  registerAudience: async (data: RegisterAudienceRequest): Promise<RegisterResponse> => {
    const response = await api.post<RegisterResponse>("/api/v1/auth/register/audience", data);
    return response.data;
  },

  // POST /api/v1/auth/verify-email
  verifyEmail: async (data: VerifyEmailRequest): Promise<VerifyEmailResponse> => {
    const response = await api.post<VerifyEmailResponse>("/api/v1/auth/verify-email", data);
    return response.data;
  },

  // POST /api/v1/auth/send-verification-code (authenticated)
  sendVerificationCode: async (): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>("/api/v1/auth/send-verification-code");
    return response.data;
  },

  // POST /api/v1/auth/login
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>("/api/v1/auth/login", data);
    return response.data;
  },

  // POST /api/v1/auth/refresh  — browser sends HttpOnly refresh_token cookie automatically
  refresh: async (): Promise<RefreshResponse> => {
    const response = await api.post<RefreshResponse>("/api/v1/auth/refresh");
    return response.data;
  },

  // POST /api/v1/auth/logout  — clears the HttpOnly refresh_token cookie
  logout: async (): Promise<LogoutResponse> => {
    const response = await api.post<LogoutResponse>("/api/v1/auth/logout");
    return response.data;
  },

  // GET /api/v1/auth/me  — requires Bearer token
  me: async (): Promise<MeResponse> => {
    const response = await api.get<MeResponse>("/api/v1/auth/me");
    return response.data;
  },

  // PUT /api/v1/auth/me  — requires Bearer token
  updateMe: async (data: UpdateMeRequest): Promise<MeResponse> => {
    const response = await api.put<MeResponse>("/api/v1/auth/me", data);
    return response.data;
  },

  // PUT /api/v1/auth/me/email — request verification of a new address
  requestEmailChange: async (email: string): Promise<MeResponse> => {
    const response = await api.put<MeResponse>("/api/v1/auth/me/email", { email });
    return response.data;
  },

  deleteMyAccount: async (data: DeleteMyAccountRequest): Promise<void> => {
    await api.delete("/api/v1/auth/me", { data });
  },

  // POST /api/v1/auth/change-password  — requires Bearer token
  changePassword: async (data: ChangePasswordRequest): Promise<ChangePasswordResponse> => {
    const response = await api.post<ChangePasswordResponse>("/api/v1/auth/change-password", data);
    return response.data;
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Request / Response types
// All field names are camelCase — the axios interceptor converts to snake_case
// before sending and from snake_case on receipt.
// ─────────────────────────────────────────────────────────────────────────────

// ── Register organization owner ───────────────────────────────────────────────

/** Matches backend RegisterOrgOwnerRequest */
export interface RegisterOrganizationRequest {
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

// ── Register audience ─────────────────────────────────────────────────────────

/** Matches backend RegisterAudienceRequest */
export interface RegisterAudienceRequest {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  phone: string | null;
}

// ── Registration response (shared) ───────────────────────────────────────────

/** Matches backend RegisterResponse */
export interface RegisterResponse {
  userId: string;
  email: string;
  message: string;
}

// ── Verify email ──────────────────────────────────────────────────────────────

/** Matches backend VerifyEmailRequest */
export interface VerifyEmailRequest {
  email: string;
  code: string; // exactly 6 digits
}

export interface VerifyEmailResponse {
  message: string;
}

// ── Login ─────────────────────────────────────────────────────────────────────

/** Matches backend LoginRequest */
export interface LoginRequest {
  email: string;
  password: string;
}

/** Matches backend LoginResponse — only session bootstrap, no identity */
export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number; // i64 seconds
}

// ── Refresh ───────────────────────────────────────────────────────────────────

/** Matches backend RefreshTokenResponse */
export interface RefreshResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number; // i64 seconds
}

// ── Logout ────────────────────────────────────────────────────────────────────

/** Matches backend LogoutResponse */
export interface LogoutResponse {
  message: string;
}

// ── Me / Profile ──────────────────────────────────────────────────────────────

/** Matches backend ProfileResponse */
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
  role: string;
  organizationId?: string; // present for org_owner and coordinator roles
}

/**
 * The authenticated user held in frontend state.
 * Populated by calling /me after a successful login or token refresh.
 */
export interface CurrentUser {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: import("@/src/lib/auth/roles").FrontendRole;
  organizationId?: string;
  profileImageUrl?: string | null;
  emailVerifiedAt?: string | null;
  pendingEmail?: string | null;
  mustChangePassword?: boolean;
}

/** Matches backend UpdateProfileRequest */
export interface UpdateMeRequest {
  firstName: string;
  middleName: string | null;
  lastName: string;
  phone: string | null;
  profileImageUrl: string | null;
}

export interface DeleteMyAccountRequest {
  currentPassword: string;
  confirmation: string;
}

// ── Change password ───────────────────────────────────────────────────────────

/** Matches backend ChangePasswordRequest */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
  message: string;
}
