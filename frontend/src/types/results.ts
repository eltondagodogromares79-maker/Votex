/**
 * Results types.
 *
 * Source of truth: backend domain model in
 *   src/domain/models/results.rs
 *
 * Naming rules:
 *   • Enum variants: snake_case strings  (#[serde(rename_all = "snake_case")])
 *   • Struct fields in API responses: camelCase  (#[serde(rename_all = "camelCase")])
 *
 * Score fields (raw_score, weighted_score, etc.) are rust_decimal::Decimal
 * and are serialised as plain strings.
 */

// ─── Enums ────────────────────────────────────────────────────────────────────

/**
 * results.rs ResultStatus — DB type `result_status`
 */
export type ResultStatus = "calculated" | "finalized" | "invalidated";

/**
 * results.rs ResultType — DB type `result_type`
 */
export type ResultType =
  | "winner"
  | "runner_up"
  | "finalist"
  | "placement"
  | "special_award";

/**
 * results.rs TieBreakType — DB type `tie_break_type`
 */
export type TieBreakType =
  | "highest_category_score"
  | "highest_criterion_score"
  | "highest_qa_score"
  | "first_place_votes"
  | "highest_overall_score"
  | "manual";

// ─── Domain models ────────────────────────────────────────────────────────────

/**
 * results.rs RoundResult struct.
 * Per-round ranking for one candidate.
 * All score fields are Decimal serialised as strings.
 */
export interface RoundResult {
  id: string;
  roundId: string;
  candidateId: string;
  rawScore: string;               // Decimal as string
  normalizedScore: string | null;
  weightedScore: string;
  rank: number;                   // i32
  status: ResultStatus;
  calculatedAt: string;
  calculationVersion: string;
}

/**
 * results.rs PageantResult struct.
 * Final overall ranking for one candidate.
 */
export interface PageantResult {
  id: string;
  pageantId: string;
  candidateId: string;
  finalScore: string;    // Decimal as string
  finalRank: number;
  resultType: ResultType;
  publishedAt: string | null;
  calculationVersion: string;
  createdAt: string;
}

/**
 * results.rs TieBreakRule struct.
 * Configures how ties are broken for a pageant or specific round.
 */
export interface TieBreakRule {
  id: string;
  pageantId: string;
  roundId: string | null;
  priority: number;
  ruleType: TieBreakType;
  configuration: Record<string, unknown>;
  createdAt: string;
}

// ─── API Contract types ────────────────────────────────────────────────────────

/**
 * Response from GET /api/v1/rounds/:id/results
 * Items in the results list.
 */
export interface RoundResultResponse {
  id: string;
  roundId: string;
  candidateId: string;
  rawScore: string;
  weightedScore: string;
  rank: number;
  status: ResultStatus;
  calculatedAt: string;
  calculationVersion: string;
}

/**
 * POST /api/v1/rounds/:id/results/calculate — response
 */
export interface CalculateRoundResultsResponse {
  roundId: string;
  resultsCount: number;
  message: string;
}

/**
 * Response from GET /api/v1/pageants/:id/results
 */
export interface PageantResultResponse {
  id: string;
  pageantId: string;
  candidateId: string;
  finalScore: string;
  finalRank: number;
  resultType: ResultType;
  publishedAt: string | null;
  calculationVersion: string;
  createdAt: string;
}

/**
 * Generic list response wrapper for results endpoints.
 */
export interface ResultsListResponse<T> {
  results: T[];
  total: number;
}
