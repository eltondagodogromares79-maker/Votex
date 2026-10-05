export { api, ApiError, setAccessToken, getAccessToken } from "./client";

// Auth API and types live co-located with the auth feature
export { authApi } from "@/src/features/auth/api/authentication";
export type {
  RegisterOrganizationRequest,
  RegisterAudienceRequest,
  RegisterResponse,
  VerifyEmailRequest,
  VerifyEmailResponse,
  LoginRequest,
  LoginResponse,
  RefreshResponse,
  LogoutResponse,
  MeResponse,
  UpdateMeRequest,
  ChangePasswordRequest,
  ChangePasswordResponse,
} from "@/src/features/auth/api/authentication";
