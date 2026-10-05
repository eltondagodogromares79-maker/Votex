/**
 * Round types.
 *
 * Source of truth: backend/portals/coordinator/src/contracts/rounds.rs
 *
 * RoundType and RoundStatus use serde rename_all = "SCREAMING_SNAKE_CASE".
 */

/**
 * coordinator/contracts/rounds.rs RoundType.
 * serde: rename_all = "SCREAMING_SNAKE_CASE"
 */
export type RoundType =
  | "PRELIMINARY"
  | "SWIMWEAR"
  | "FORMAL_WEAR"
  | "TALENT"
  | "QUESTION_AND_ANSWER"
  | "FINAL"
  | "CUSTOM";

/**
 * coordinator/contracts/rounds.rs RoundStatus.
 * serde: rename_all = "SCREAMING_SNAKE_CASE"
 */
export type RoundStatus = "DRAFT" | "OPEN" | "CLOSED" | "FINALIZED";

/**
 * coordinator/contracts/rounds.rs RoundResponse.
 * Returned by coordinator round endpoints.
 * startsAt/endsAt are RFC 3339 strings.
 */
export interface RoundResponse {
  id: string;
  pageantId: string;
  name: string;
  roundNumber: number;
  roundType: RoundType;
  status: RoundStatus;
  advancementCount: number | null;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type Round = RoundResponse;

/**
 * coordinator/contracts/rounds.rs CreateRoundRequest.
 * roundNumber min = 1.
 */
export interface CreateRoundRequest {
  name: string;
  roundNumber: number;
  roundType: RoundType;
  advancementCount?: number | null;
  startsAt?: string | null;
  endsAt?: string | null;
}

/**
 * coordinator/contracts/rounds.rs UpdateRoundRequest.
 * Extends create with required status field.
 */
export interface UpdateRoundRequest extends CreateRoundRequest {
  status: RoundStatus;
}
