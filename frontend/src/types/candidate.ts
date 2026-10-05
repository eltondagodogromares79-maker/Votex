/**
 * Contestant / Candidate types.
 *
 * Source of truth: backend/portals/coordinator/src/contracts/contestants.rs
 *
 * Note: the backend uses "contestant" everywhere; the frontend uses "candidate"
 * as a UI alias. Wire field names match the backend exactly after camelCase conversion.
 */

/**
 * coordinator/contracts/contestants.rs ContestantResponse.
 * Returned by contestant CRUD endpoints.
 */
export interface CandidateResponse {
  id: string;
  pageantId: string;
  userId: string | null;
  contestantNumber: number;
  firstName: string;
  middleName: string | null;
  lastName: string;
  displayName: string;
  gender: string | null;
  photoUrl: string | null;
  biography: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type Candidate = CandidateResponse;

/**
 * coordinator/contracts/contestants.rs ContestantRequest.
 * Used by both create and update handlers.
 * contestantNumber min = 1.
 */
export interface AddCandidateRequest {
  contestantNumber: number;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  displayName?: string | null;
  gender?: string | null;
  photoUrl?: string | null;
  biography?: string | null;
  userId?: string | null;
}

export type UpdateCandidateRequest = AddCandidateRequest;
