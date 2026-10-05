"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SessionContext } from "../context/SessionContext";
import { authApi, type CurrentUser } from "../api/authentication";
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
 * SessionProvider — placed at the root layout.
 *
 * On mount:
 *   1. POST /api/v1/auth/refresh   — exchanges the HttpOnly refresh cookie
 *                                    for a new access token
 *   2. GET  /api/v1/auth/me        — loads the authenticated user + role
 *   3. Stores CurrentUser in context so every component can call useSession()
 *
 * On failure (no cookie, expired, revoked):
 *   - Clears the access token from axios
 *   - Sets currentUser to null
 *   - isReady = true so the app can render the login page
 *
 * The access token is never stored in localStorage or a readable cookie.
 * It lives only in memory (axios default headers) and is refreshed here.
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUserState] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const initialized = useRef(false);

  const setCurrentUser = useCallback((user: CurrentUser | null) => {
    setCurrentUserState(user);
  }, []);

  useEffect(() => {
    // Strict-mode guard — only run once
    if (initialized.current) return;
    initialized.current = true;

    (async () => {
      try {
        // 1. Refresh — uses the HttpOnly cookie automatically (withCredentials)
        const refreshResponse = await authApi.refresh();

        // 2. Store the new access token in memory
        setAccessToken(refreshResponse.accessToken);

        // 3. Load identity from /me — backend reads user_id from JWT sub
        const me = await authApi.me();

        if (!isValidRole(me.role)) {
          throw new Error(`Unrecognised role: "${me.role}"`);
        }

        setCurrentUserState({
          userId: me.userId,
          email: me.email,
          firstName: me.firstName,
          lastName: me.lastName,
          role: me.role,
          organizationId: me.organizationId,
          profileImageUrl: me.profileImageUrl,
        });
      } catch {
        // No valid session — clear any stale token
        setAccessToken(null);
        setCurrentUserState(null);
      } finally {
        setIsLoading(false);
        setIsReady(true);
      }
    })();
  }, []);

  return (
    <SessionContext.Provider
      value={{ currentUser, isLoading, isReady, setCurrentUser }}
    >
      {children}
    </SessionContext.Provider>
  );
}
