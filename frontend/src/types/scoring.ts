/**
 * Scoring types.
 *
 * Source of truth: backend domain model in
 *   src/domain/models/scoring.rs
 *
 * Naming rules:
 *   • Enum variants: snake_case strings  (#[serde(rename_all = "snake_case")])
 *   • Struct fields in API responses: camelCase  (#[serde(rename_all = "camelCase")])
 *
 * Key differences from the old frontend types:
 *   - ScoreStatus is now an enum: draft | submitted | locked | invalidated
 *   - Score.score is Decimal (string), NOT an integer 0–100
 *   - Score has: round_id, category_id, criterion_id, candidate_id, judge_id,
 *     submitted_at, locked_at, status, version (NOT pageant_id, NOT value)
 *   - JudgeAssignment is a real domain model with revoked_at
 *   - ScoreRevision tracks the audit trail of score changes
 */

// ─── Enums ────────────────────────────────────────────────────────────────────

/**
 * scoring.rs ScoreStatus — DB type `score_status`
 * Variants: Draft | Submitted | Locked | Invalidated
 */
export type ScoreStatus = "draft" | "submitted" | "locked" | "invalidated";

// ─── Domain models ────────────────────────────────────────────────────────────

/**
 * scoring.rs JudgeAssignment struct.
 * Associates a Judge with a Round + Category for scoring.
 * Fields: id, judge_id, round_id, category_id, assigned_at, revoked_at, created_at
 *
 * IMPORTANT: judge_id here refers to judges.id (the pageant-member record),
 * NOT the user's UUID.
 */
export interface JudgeAssignment {
  id: string;
  judgeId: string;      // judges.id — NOT users.id
  roundId: string;
  categoryId: string;
  assignedAt: string;
  revokedAt: string | null;
  createdAt: string;
}

/**
 * scoring.rs Score struct.
 * score is rust_decimal::Decimal serialised as a string.
 * version is an optimistic-lock counter (starts at 1).
 */
export interface Score {
  id: string;
  roundId: string;
  categoryId: string;
  criterionId: string;
  candidateId: string;
  judgeId: string;      // judges.id — NOT users.id
  score: string;        // Decimal as string
  submittedAt: string | null;
  lockedAt: string | null;
  status: ScoreStatus;
  version: number;      // i32
  createdAt: string;
  updatedAt: string;
}

/**
 * scoring.rs ScoreRevision struct.
 * Audit trail entry created whenever a score changes.
 */
export interface ScoreRevision {
  id: string;
  scoreId: string;
  previousScore: string;   // Decimal as string
  newScore: string;
  reason: string;
  changedBy: string;       // users.id
  changedAt: string;
}

// ─── API Contract types ────────────────────────────────────────────────────────

/**
 * POST /api/v1/rounds/:id/scores — request body (save/upsert draft score)
 * judgeId: judges.id (NOT users.id)
 */
export interface SaveScoreRequest {
  categoryId: string;
  criterionId: string;
  candidateId: string;
  judgeId: string;
  score: number;        // Decimal
}

/** Response from POST /api/v1/rounds/:id/scores and GET /api/v1/rounds/:id/scores */
export interface ScoreResponse {
  id: string;
  roundId: string;
  categoryId: string;
  criterionId: string;
  candidateId: string;
  judgeId: string;
  score: string;        // Decimal as string
  status: ScoreStatus;
  version: number;
  submittedAt: string | null;
  lockedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** POST /api/v1/scores/submit — request body */
export interface SubmitScoreRequest {
  scoreId: string;
}

/** POST /api/v1/scores/invalidate — request body */
export interface InvalidateScoreRequest {
  scoreId: string;
  reason: string;
}

/** POST /api/v1/rounds/:id/scores/lock — response */
export interface LockScoresResponse {
  lockedCount: number;
  message: string;
}

/**
 * GET /api/v1/scores/:id/revisions — response items
 */
export interface ScoreRevisionResponse {
  id: string;
  scoreId: string;
  previousScore: string;
  newScore: string;
  reason: string;
  changedBy: string;
  changedAt: string;
}

/**
 * POST /api/v1/rounds/:id/judge-assignments — request body
 * judgeId: judges.id (the pageant-member record, NOT users.id)
 */
export interface AssignJudgeRequest {
  judgeId: string;
  categoryId: string;
}

/** Response from judge assignment endpoints */
export interface JudgeAssignmentResponse {
  id: string;
  judgeId: string;
  roundId: string;
  categoryId: string;
  assignedAt: string;
  revokedAt: string | null;
}

/** DELETE /api/v1/rounds/:id/judge-assignments — request body */
export interface RevokeJudgeAssignmentRequest {
  judgeId: string;
  categoryId: string;
}
