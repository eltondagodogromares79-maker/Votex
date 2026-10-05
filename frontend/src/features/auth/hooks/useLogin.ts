import { useMutation } from "@tanstack/react-query";
import { authApi, type CurrentUser, type LoginRequest } from "../api/authentication";
import { setAccessToken } from "@/src/lib/api/client";
import type { FrontendRole } from "@/src/lib/auth/roles";

const VALID_ROLES: FrontendRole[] = [
  "admin",
  "org_owner",
  "coordinator",
  "judge",
  "tabulator",
  "audience",
];

function isValidRole(role: string): role is FrontendRole {
  return VALID_ROLES.includes(role as FrontendRole);
}

/**
 * Full authentication flow:
 *
 *  1. POST /api/v1/auth/login   → receive access token
 *  2. Store access token in axios default headers (in-memory only)
 *  3. GET  /api/v1/auth/me      → receive current user + role
 *  4. Return CurrentUser to the caller
 *
 * The caller (SignInForm) is responsible for:
 *  - writing at_hint cookie
 *  - redirecting to ROLE_HOME[currentUser.role]
 */
export function useLogin() {
  return useMutation({
    mutationFn: async (data: LoginRequest): Promise<CurrentUser> => {
      // Step 1 — authenticate, receive short-lived access token
      const loginResponse = await authApi.login(data);

      // Step 2 — store access token in memory so every subsequent
      //           axios request carries Authorization: Bearer <token>
      setAccessToken(loginResponse.accessToken);

      // Step 3 — load the current user's identity and role from the backend
      //           The backend reads user_id from the JWT sub claim — we never
      //           send user_id from the frontend.
      const me = await authApi.me();

      // Step 4 — validate the role returned by the backend
      if (!isValidRole(me.role)) {
        // Clear the token so the user isn't left in a broken half-authenticated state
        setAccessToken(null);
        throw new Error(`Unrecognised role received from server: "${me.role}"`);
      }

      const currentUser: CurrentUser = {
        userId: me.userId,
        email: me.email,
        firstName: me.firstName,
        lastName: me.lastName,
        role: me.role,
        organizationId: me.organizationId,
        profileImageUrl: me.profileImageUrl,
      };

      return currentUser;
    },
  });
}
