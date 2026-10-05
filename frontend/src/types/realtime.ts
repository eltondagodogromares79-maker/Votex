/**
 * Realtime / WebSocket types.
 *
 * Source of truth: backend domain model in
 *   src/domain/models/realtime.rs
 *
 * Naming rules:
 *   • PageantEventType enum variants: snake_case strings
 *   • Payload fields: camelCase
 *
 * PageantEventType (20 variants from realtime.rs):
 *   pageant_started | pageant_paused | pageant_resumed | pageant_completed |
 *   round_opened | round_scoring_started | round_scoring_locked |
 *   round_results_ready | round_closed |
 *   candidate_advanced | candidate_eliminated |
 *   judge_connected | judge_disconnected |
 *   score_submitted | score_updated |
 *   results_calculated | results_published |
 *   voting_opened | voting_closed | vote_received
 */

// ─── Enums ────────────────────────────────────────────────────────────────────

/**
 * realtime.rs PageantEventType — DB type `pageant_event_type`
 * All 20 variants, snake_case.
 */
export type PageantEventType =
  | "pageant_started"
  | "pageant_paused"
  | "pageant_resumed"
  | "pageant_completed"
  | "round_opened"
  | "round_scoring_started"
  | "round_scoring_locked"
  | "round_results_ready"
  | "round_closed"
  | "candidate_advanced"
  | "candidate_eliminated"
  | "judge_connected"
  | "judge_disconnected"
  | "score_submitted"
  | "score_updated"
  | "results_calculated"
  | "results_published"
  | "voting_opened"
  | "voting_closed"
  | "vote_received";

/** WebSocket connection states for the usePageantRealtime hook */
export type WsConnectionState =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected"
  | "error";

// ─── Domain model ─────────────────────────────────────────────────────────────

/**
 * realtime.rs PageantEvent struct.
 * Each event has a per-pageant monotonically increasing sequence number.
 * payload is an opaque JSON blob; typed per eventType below.
 */
export interface PageantEvent {
  id: string;
  pageantId: string;
  roundId: string | null;
  eventType: PageantEventType;
  actorUserId: string | null;
  payload: Record<string, unknown>;
  sequence: number;               // i64 — per-pageant sequence
  createdAt: string;
}

// ─── WebSocket message types ───────────────────────────────────────────────────

/**
 * Typed WebSocket event pushed to clients.
 * Uses a discriminated union on eventType for type-safe payload access.
 */
export type WsPageantEvent =
  | {
      eventType: "score_submitted";
      data: {
        judgeId: string;
        candidateId: string;
        criterionId: string;
        score: string;              // Decimal as string
        timestamp: string;
      };
    }
  | {
      eventType: "score_updated";
      data: {
        scoreId: string;
        judgeId: string;
        candidateId: string;
        criterionId: string;
        previousScore: string;
        newScore: string;
        timestamp: string;
      };
    }
  | {
      eventType: "round_opened";
      data: {
        roundId: string;
        roundName: string;
        timestamp: string;
      };
    }
  | {
      eventType: "round_scoring_started";
      data: { roundId: string; timestamp: string };
    }
  | {
      eventType: "round_scoring_locked";
      data: { roundId: string; timestamp: string };
    }
  | {
      eventType: "round_results_ready";
      data: { roundId: string; timestamp: string };
    }
  | {
      eventType: "round_closed";
      data: { roundId: string; timestamp: string };
    }
  | {
      eventType: "candidate_advanced";
      data: {
        candidateId: string;
        fromRoundId: string;
        toRoundId: string | null;
        timestamp: string;
      };
    }
  | {
      eventType: "candidate_eliminated";
      data: {
        candidateId: string;
        fromRoundId: string;
        timestamp: string;
      };
    }
  | {
      eventType: "results_calculated";
      data: { roundId: string; timestamp: string };
    }
  | {
      eventType: "results_published";
      data: { pageantId: string; timestamp: string };
    }
  | {
      eventType: "judge_connected" | "judge_disconnected";
      data: { judgeId: string; timestamp: string };
    }
  | {
      eventType:
        | "pageant_started"
        | "pageant_paused"
        | "pageant_resumed"
        | "pageant_completed"
        | "voting_opened"
        | "voting_closed"
        | "vote_received";
      data: Record<string, unknown>;
    };

/** Message the WebSocket client can send to the server */
export type WsClientMessage = { action: "ping" };
