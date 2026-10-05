"use client";

import { useEffect } from "react";
import { useSession } from "../context/SessionContext";
import type { FrontendRole } from "@/src/lib/auth/roles";
import { ROLE_HOME } from "@/src/config/permissions";

interface RouteGuardProps {
  /** The single role allowed to view this section. */
  allowedRole: FrontendRole;
  /** The login page to redirect unauthenticated users to. */
  loginPath: string;
  children: React.ReactNode;
}

/**
 * RouteGuard — Layer 2 client-side route protection.
 *
 * Works alongside proxy.ts (Layer 1, server-side cookie check).
 *
 * While SessionProvider is restoring the session on mount:
 *   → renders a loading skeleton (no flash of content)
 *
 * Once the session is ready:
 *   → No session (token expired, no cookie): hard-redirect to login
 *   → Session exists but wrong role (forged at_hint): hard-redirect to /forbidden
 *   → Correct role: renders children
 *
 * The redirect is a hard navigation (window.location.href) so the proxy
 * re-evaluates the at_hint cookie on the next server request.
 */
export function RouteGuard({ allowedRole, loginPath, children }: RouteGuardProps) {
  const { currentUser, isReady } = useSession();

  useEffect(() => {
    if (!isReady) return;

    if (!currentUser) {
      // Not authenticated — redirect to the correct login page
      const redirect = encodeURIComponent(window.location.pathname);
      window.location.replace(`${loginPath}?redirect=${redirect}`);
      return;
    }

    if (currentUser.role !== allowedRole) {
      // Authenticated but wrong role (forged at_hint passed the proxy)
      // Redirect them to their own dashboard, not /forbidden,
      // since they ARE logged in — just in the wrong place.
      window.location.replace(ROLE_HOME[currentUser.role]);
    }
  }, [isReady, currentUser, allowedRole, loginPath]);

  // ── Loading state — session restore in progress ───────────────────────────
  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate">
        <div className="flex flex-col items-center gap-4">
          <svg
            className="animate-spin w-8 h-8 text-gold"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12" cy="12" r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <p className="text-small text-white/40">Verifying session…</p>
        </div>
      </div>
    );
  }

  // ── Not authenticated or wrong role ───────────────────────────────────────
  // useEffect handles the redirect — render nothing while it fires.
  if (!currentUser || currentUser.role !== allowedRole) {
    return null;
  }

  // ── Authenticated with correct role ───────────────────────────────────────
  return <>{children}</>;
}
