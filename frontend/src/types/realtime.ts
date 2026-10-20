/** Pageant event sent over WebSocket to trigger an authorized API refetch. */
export interface WsPageantEvent {
  pageantId: string;
  event: "scores.updated" | "pageant.changed";
  occurredAt: string;
}

export type WsConnectionState =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected"
  | "error";
