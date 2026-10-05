import { type NextRequest, NextResponse } from "next/server";
import type { FrontendRole } from "@/src/lib/auth/roles";

/**
 * Next.js 16 Proxy (renamed from middleware).
 *
 * Layer 1 of route protection — fast, server-side, cookie-based.
 *
 * Runs before every page render. Does two checks:
 *   1. Is the user authenticated?  (at_hint cookie exists)
 *   2. Does their role match the route?  (at_hint value matches required role)
 *
 * On failure:
 *   - Not authenticated  → redirect to role-specific login page with ?redirect=<path>
 *   - Wrong role         → redirect to /forbidden
 *
 * IMPORTANT: This is a UX gate, not the security boundary.
 * The Rust backend enforces real authorization on every API call.
 * A forged at_hint cookie passes this gate but gets blocked by the backend.
 * The client-side RouteGuard (Layer 2) catches forged cookies by verifying
 * the real session via /me.
 */

const AT_HINT_COOKIE = "at_hint";

// ─── Route → required role mapping ───────────────────────────────────────────

const PROTECTED_ROUTES: Array<{ prefix: string; role: FrontendRole; loginPath: string }> = [
  { prefix: "/admin",       role: "admin",       loginPath: "/login"            },
  { prefix: "/org_owner",   role: "org_owner",   loginPath: "/login/org-owner"  },
  { prefix: "/coordinator", role: "coordinator", loginPath: "/login/coordinator" },
  { prefix: "/judge",       role: "judge",       loginPath: "/login/judge"      },
  { prefix: "/tabulator",   role: "tabulator",   loginPath: "/login/tabulator"  },
  { prefix: "/audience",    role: "audience",    loginPath: "/login/audience"   },
];

// ─── Proxy function ───────────────────────────────────────────────────────────

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Find the matching protected route (if any)
  const route = PROTECTED_ROUTES.find((r) => pathname.startsWith(r.prefix));

  // Public route — pass through
  if (!route) return NextResponse.next();

  const roleHint = request.cookies.get(AT_HINT_COOKIE)?.value as FrontendRole | undefined;

  // No cookie — user is not authenticated → send to the correct login page
  if (!roleHint) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = route.loginPath;
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Wrong role — user IS authenticated but has no access to this section
  if (roleHint !== route.role) {
    const forbiddenUrl = request.nextUrl.clone();
    forbiddenUrl.pathname = "/forbidden";
    forbiddenUrl.search = "";
    return NextResponse.redirect(forbiddenUrl);
  }

  // Correct role — pass through to the page
  return NextResponse.next();
}

// ─── Matcher ──────────────────────────────────────────────────────────────────

export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     *   - _next/static  (static assets)
     *   - _next/image   (image optimization)
     *   - favicon.ico
     *   - /api/         (API routes / proxy rewrites to backend)
     *   - common image/font file extensions
     */
    "/((?!_next/static|_next/image|favicon\\.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};
