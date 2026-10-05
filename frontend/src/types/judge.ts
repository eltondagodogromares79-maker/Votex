/**
 * Judge view types.
 *
 * Source of truth:
 *   src/domain/models/participants.rs  (Judge domain model)
 *   src/api/scoring/handlers.rs        (judge assignment / scoring API)
 *
 * The Judge domain model (participants.rs) has:
 *   id, pageant_member_id, pageant_id, judge_code, status, created_at, updated_at
 *
 * There is NO full_name, email, initials, or login_code on the Judge domain model
 * itself — those come from the joined User / UserProfile rows.
 *
 * The API response DTOs below model what the backend handlers actually return.
 * Fields that reference old, nonexistent backend shapes are removed.
 */

import type { PageantStatus } from "./pageant";
import type { RoundStatus } from "./round";
import type { ScoreStatus } from "./scoring";

// ─── Participant view (judge-specific) ────────────────────────────────────────

/**
 * The Judge row as returned by GET /api/v1/pageants/:id/judges
 * and POST /api/v1/pageants/:id/judges.
 * Includes the joined user identity fields the backend resolves.
 */
export interface PageantJudgeResponse {
  pageantId: string;
  userId: string;
  role: "PAGEANT_JUDGE" | "PAGEANT_TABULATOR";
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
}

// ─── Judge dashboard / view types ─────────────────────────────────────────────

/**
 * A pageant assignment entry as seen by a judge on their dashboard.
 * Returned by the judge-view endpoint (if/when it exists).
 */
export interface JudgeAssignmentSummary {
  pageantId: string;
  pageantName: string;
  pageantStatus: PageantStatus;
  roundCount: number;
  completedRounds: number;
}

/**
 * A candidate entry as shown to a judge during scoring.
 */
export interface JudgeRoundCandidate {
  id: string;           // candidates.id
  candidateNumber: number;
  representing: string;
  status: string;       // CandidateStatus as string
}

/**
 * A criterion with its scoring bounds, as shown to a judge.
 * weightBps: basis points (10000 = 100%).
 */
export interface CriterionForScoring {
  id: string;
  name: string;
  categoryName: string;
  scoringType: string;
  minScore: string;     // Decimal as string
  maxScore: string;
  weightBps: number;
}

/**
 * A score the judge has already submitted for this round.
 */
export interface JudgeScore {
  candidateId: string;
  criterionId: string;
  score: string;        // Decimal as string
  status: ScoreStatus;
  submittedAt: string | null;
}

/**
 * Full round detail as returned to a judge.
 * Includes candidates, criteria, and the judge's own submitted scores.
 */
export interface JudgeRoundDetailResponse {
  roundId: string;
  roundName: string;
  roundStatus: RoundStatus;
  candidates: JudgeRoundCandidate[];
  criteria: CriterionForScoring[];
  myScores: JudgeScore[];
}

/** POST /api/v1/coordinator/pageants/:id/judges request DTO. */
export interface AssignPageantJudgeRequest {
  email: string;
  firstName: string;
  lastName: string;
}

// Note: JudgeAssignmentResponse (the scoring endpoint response) is defined in
// scoring.ts to avoid a barrel export collision. Import from there directly if needed.
