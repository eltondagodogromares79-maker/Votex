/**
 * Backend wire contract types — pageant, round, category, contestant, judge,
 * vote-package, and vote-checkout shapes as returned/accepted by the API.
 *
 * Auth-specific types live in auth.ts.
 * Org-owner portal types live in org-owner.ts.
 * Admin portal types live in admin.ts.
 *
 * The HTTP client converts snake_case ↔ camelCase, so all names here are camelCase.
 * Decimal (rust_decimal) fields serialize as numeric strings — typed as string.
 * RoundType / RoundStatus use SCREAMING_SNAKE_CASE (serde rename_all).
 */

export type { RoundType, RoundStatus, RoundResponse, CreateRoundRequest, UpdateRoundRequest } from "./round";
export type { CategoryResponse, CriterionResponse, CreateCategoryRequest, CreateCriterionRequest } from "./category";
export type { CandidateResponse, AddCandidateRequest } from "./candidate";
export type { VotePackage, VotePackageResponse, VoteCandidate, VoteCheckout, StartVoteRequest, CreateVotePackageRequest, UpdateVotePackageRequest } from "./voting";

// ─── Coordinator ─────────────────────────────────────────────────────────────

/**
 * coordinator/contracts/pageants.rs AssignedPageantResponse.
 * Includes organizationName — the coordinator version of a pageant.
 */
export interface BackendAssignedPageantResponse {
  id: string;
  organizationId: string;
  organizationName: string;
  createdBy: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  eventDate: string | null;
  startTime: string | null;
  endTime: string | null;
  venue: string | null;
  status: string;
  isPublic: boolean;
}

export interface CoordinatorResourceLimits {
  hasActiveSubscription: boolean;
  maxJudgesPerPageant: number | null;
  maxTabulatorUsers: number | null;
  maxRoundsPerPageant: number | null;
  maxCategoriesPerRound: number | null;
  judgesUsed: number;
  tabulatorsUsed: number;
  roundsUsed: number;
  categoriesUsed: number;
  roundCategories: { roundId: string; roundName: string; categoriesUsed: number }[];
}

/**
 * coordinator/contracts/judges.rs PageantJudgeResponse.
 * Also used as PageantTabulatorResponse shape.
 */
export interface BackendPageantStaffResponse {
  pageantId: string;
  userId: string;
  role: string; // "PAGEANT_JUDGE" | "PAGEANT_TABULATOR" | "PAGEANT_COORDINATOR"
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
}

// ─── Tabulator-only ───────────────────────────────────────────────────────────

/**
 * tabulator/contracts AdvancementResponse.
 */
export interface BackendAdvancementResponse {
  id: string;
  contestantId: string;
  contestantNumber: number;
  contestantName: string;
  fromRoundId: string;
  fromRoundName: string;
  toRoundId: string;
  toRoundName: string;
  decision: string;
  reason: string | null;
  decidedBy: string | null;
  decidedAt: string;
}
