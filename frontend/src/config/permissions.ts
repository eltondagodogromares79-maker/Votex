/**
 * Route-access configuration — keyed by FrontendRole.
 *
 * Role ownership model:
 *   org_owner   → created via /register; owns an organization; home is /org-owner
 *   coordinator → created by org_owner; manages a specific pageant; home is /coordinator
 *   judge       → created by org_owner; scores candidates; home is /judge
 *   tabulator   → created by org_owner; monitors scoring; home is /tabulator
 *   audience    → self-registered; can browse and vote; home is /audience
 *   admin       → platform admin; home is /admin
 */

import type { FrontendRole } from "@/src/lib/auth/roles";

/** Where each role lands after a successful login */
export const ROLE_HOME: Record<FrontendRole, string> = {
  admin:       "/admin",
  org_owner:   "/org_owner",
  coordinator: "/coordinator",
  judge:       "/judge",
  tabulator:   "/tabulator",
  audience:    "/audience",
};

/**
 * Route prefixes each role may access.
 * The proxy checks that the requested pathname starts with one of these.
 * org_owner can also access /coordinator routes since they manage pageants.
 */
export const ROLE_ALLOWED_PREFIXES: Record<FrontendRole, string[]> = {
  admin:       ["/admin", "/org_owner", "/coordinator"],
  org_owner:   ["/org_owner", "/coordinator"],
  coordinator: ["/coordinator"],
  judge:       ["/judge"],
  tabulator:   ["/tabulator"],
  audience:    ["/audience"],
};

/** Prefixes that always require authentication (any valid FrontendRole). */
export const PROTECTED_PREFIXES = [
  // "/admin",
  "/org_owner",
  "/coordinator",
  "/judge",
  "/tabulator",
  "/audience",
];

/** Returns true if a user with the given role can access the given pathname. */
export function canAccess(role: FrontendRole, pathname: string): boolean {
  return ROLE_ALLOWED_PREFIXES[role].some((prefix) =>
    pathname.startsWith(prefix),
  );
}
