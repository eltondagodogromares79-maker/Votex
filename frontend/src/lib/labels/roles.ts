/**
 * Display labels for FrontendRole variants.
 */

import type { FrontendRole } from "@/src/lib/auth/roles";

export { ROLE_LABEL, ROLE_SHORT } from "@/src/lib/auth/roles";

export const ROLE_DESCRIPTION: Record<FrontendRole, string> = {
  admin:       "Platform administration",
  org_owner:   "Owns the organization; creates pageants and staff accounts",
  coordinator: "Manages a specific pageant event",
  judge:       "Scores candidates in assigned rounds",
  tabulator:   "Monitors scores and manages round advancement",
  audience:    "Follows live pageants and participates in audience voting",
};
