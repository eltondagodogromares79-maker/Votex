/**
 * Central role mapping: backend role codes → frontend display roles.
 *
 * Backend role codes (migration 0030):
 *   admin, org_owner, coordinator, tabulator, judge, candidate, audience
 *
 * Frontend roles exposed in the UI:
 *   admin | org_owner | coordinator | judge | tabulator | audience
 *
 * Role hierarchy & ownership:
 *   - org_owner  → owns an organization; creates coordinators, judges, tabulators
 *   - coordinator → pageant-scoped; manages a specific pageant
 *   - judge / tabulator → pageant-scoped staff, created by org_owner
 *   - audience   → platform-level; can browse and vote
 *   - admin      → platform administration
 *
 * Registration flow:
 *   /register → creates an org_owner account (+ organization)
 *   Coordinator / Judge / Tabulator accounts are created by the org_owner.
 *   Audience can self-register.
 *
 * RULE: never modify backend role values. All translation happens here.
 */

/** Every role code the backend can return in an API response. */
export type BackendRole =
  | "admin"
  | "org_owner"
  | "coordinator"
  | "tabulator"
  | "judge"
  | "candidate"
  | "audience";

/**
 * The roles the frontend presents in navigation, routing, and dashboards.
 * `candidate` is excluded — candidates have no dedicated dashboard in this UI.
 */
export type FrontendRole =
  | "admin"
  | "org_owner"
  | "coordinator"
  | "judge"
  | "tabulator"
  | "audience";

/**
 * Map a backend role code to the frontend display role.
 * Returns null for roles with no dashboard (candidate only).
 */
export function toFrontendRole(backendRole: BackendRole): FrontendRole | null {
  switch (backendRole) {
    case "admin":       return "admin";
    case "org_owner":   return "org_owner";
    case "coordinator": return "coordinator";
    case "judge":       return "judge";
    case "tabulator":   return "tabulator";
    case "audience":    return "audience";
    case "candidate":   return null;
    default:            return null;
  }
}

/** Human-readable display label for each frontend role. */
export const ROLE_LABEL: Record<FrontendRole, string> = {
  admin:       "Admin",
  org_owner:   "Organization Owner",
  coordinator: "Coordinator",
  judge:       "Judge",
  tabulator:   "Tabulator",
  audience:    "Audience",
};

/** Short label used in sidebar / badges */
export const ROLE_SHORT: Record<FrontendRole, string> = {
  admin:       "Admin",
  org_owner:   "Org Owner",
  coordinator: "Coordinator",
  judge:       "Judge",
  tabulator:   "Tabulator",
  audience:    "Audience",
};

/** Returns true if a backend role string maps to a routable dashboard role. */
export function hasDashboard(backendRole: BackendRole): boolean {
  return toFrontendRole(backendRole) !== null;
}
