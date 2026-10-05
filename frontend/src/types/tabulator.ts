/**
 * Tabulator view types.
 *
 * Source of truth:
 *   src/domain/models/participants.rs  (Tabulator domain model)
 *
 * The Tabulator domain model has:
 *   id, pageant_member_id, pageant_id, tabulator_code, status, created_at, updated_at
 *
 * Like the Judge model, there is NO full_name, initials, or login_code
 * on the Tabulator domain struct — those come from joined User/UserProfile rows.
 */

import type { PageantStatus } from "./pageant";
import type { RoundStatus } from "./round";
import type { PageantJudgeResponse } from "./judge";

// ─── Participant view (tabulator-specific) ─────────────────────────────────────

/**
 * The Tabulator row as returned by GET /api/v1/pageants/:id/tabulators
 * and POST /api/v1/pageants/:id/tabulators.
 */
export type PageantTabulatorResponse = PageantJudgeResponse;

/** POST /api/v1/coordinator/pageants/:id/tabulators request DTO. */
export interface AddTabulatorRequest {
  email: string;
  firstName: string;
  lastName: string;
}

export type UpdateTabulatorStatusRequest = never;

// ─── Tabulator dashboard / view types ─────────────────────────────────────────

/**
 * A pageant assignment entry as seen by a tabulator on their dashboard.
 */
export interface TabulatorAssignmentSummary {
  pageantId: string;
  pageantName: string;
  pageantStatus: PageantStatus;
  roundCount: number;
  judgeCount: number;
}

/**
 * A candidate entry in the tabulation grid.
 */
export interface TabulatorRoundCandidate {
  id: string;           // candidates.id
  candidateNumber: number;
  representing: string;
  status: string;       // CandidateStatus as string
}

/**
 * A criterion shown in the tabulation grid.
 * weightBps: basis points (10000 = 100%).
 */
export interface CriterionForTabulation {
  id: string;
  name: string;
  categoryName: string;
  scoringType: string;
  minScore: string;     // Decimal as string
  maxScore: string;
  weightBps: number;
}

/**
 * A single judge's score for a specific criterion + candidate.
 * judgeId: judges.id — NOT users.id
 */
export interface JudgeScoreDetail {
  judgeId: string;
  judgeCode: string;
  score: string;        // Decimal as string
  status: string;       // ScoreStatus as string
}

/**
 * All judges' scores for one criterion on one candidate.
 */
export interface CriterionScoreGrid {
  criterionId: string;
  criterionName: string;
  scores: JudgeScoreDetail[];
  averageScore: string | null;   // Decimal as string; null if no submitted scores
}

/**
 * Full tabulation row for one candidate in a round.
 */
export interface CandidateTabulation {
  candidateId: string;
  candidateNumber: number;
  representing: string;
  criteriaScores: CriterionScoreGrid[];
  weightedTotal: string | null;  // Decimal as string; null until calculated
}

/**
 * Full round tabulation view as returned to a tabulator.
 */
export interface TabulatorRoundDetailResponse {
  roundId: string;
  roundName: string;
  roundStatus: RoundStatus;
  candidates: CandidateTabulation[];
  criteria: CriterionForTabulation[];
}

/**
 * POST /api/v1/rounds/:id/results/calculate — response
 */
export interface CalculateResultsResponse {
  roundId: string;
  calculatedCount: number;
  message: string;
}
