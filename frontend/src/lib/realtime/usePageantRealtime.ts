"use client";

/**
 * usePageantRealtime — single hook for all live views (scoring, tabulation, leaderboard).
 *
 * The Rust backend exposes a WebSocket actor per pageant at:
 *   ws(s)://<host>/api/v1/ws/pageants/{pageant_id}
 *
 * Each PageantEvent broadcast from the server uses the shape:
 *   { type: "<event_type>", data: { … } }
 * (Rust: #[serde(tag = "type", content = "data")])
 *
 * Features:
 * - Automatic reconnect with exponential backoff (max 30s)
 * - Visible connection state for "reconnecting…" UI
 * - Unsubscribes cleanly on unmount
 * - Event listener pattern — callers register typed handlers via onEvent
 *
 * Note: Backend WS auth is currently a TODO (user_id = Uuid::nil()).
 *       The hook sends the access token as a query param as a forward-compat
 *       measure. See TODO_BACKEND.md #1.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { getAccessToken } from "@/src/lib/api/client";
import type { WsPageantEvent, WsConnectionState } from "@/src/types/realtime";

const WS_BASE =
  (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080")
    .replace(/^https?/, (p) => (p === "https" ? "wss" : "ws"));

const INITIAL_RETRY_MS = 1_000;
const MAX_RETRY_MS = 30_000;
const BACKOFF_FACTOR = 2;

type EventHandler = (event: WsPageantEvent) => void;

interface UsePageantRealtimeOptions {
  /** Called every time a PageantEvent arrives */
  onEvent?: EventHandler;
  /** Called on connection state change */
  onStateChange?: (state: WsConnectionState) => void;
  enabled?: boolean;
}

interface UsePageantRealtimeReturn {
  connectionState: WsConnectionState;
  /** Manually disconnect and stop reconnecting */
  disconnect: () => void;
  /** Manually reconnect (e.g. user clicks "Reconnect" button) */
  reconnect: () => void;
}

export function usePageantRealtime(
  pageantId: string,
  options: UsePageantRealtimeOptions = {},
): UsePageantRealtimeReturn {
  const { onEvent, onStateChange, enabled = true } = options;

  const [connectionState, setConnectionState] =
    useState<WsConnectionState>("connecting");

  const wsRef = useRef<WebSocket | null>(null);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryDelayRef = useRef(INITIAL_RETRY_MS);
  const stoppedRef = useRef(false);

  const onEventRef = useRef(onEvent);
  const onStateChangeRef = useRef(onStateChange);
  useEffect(() => { onEventRef.current = onEvent; }, [onEvent]);
  useEffect(() => { onStateChangeRef.current = onStateChange; }, [onStateChange]);

  const updateState = useCallback((s: WsConnectionState) => {
    setConnectionState(s);
    onStateChangeRef.current?.(s);
  }, []);

  const connect = useCallback(() => {
    if (stoppedRef.current || !pageantId) return;

    const token = getAccessToken();
    const url = `${WS_BASE}/api/v1/ws/pageants/${pageantId}${token ? `?token=${encodeURIComponent(token)}` : ""}`;

    updateState("connecting");
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      retryDelayRef.current = INITIAL_RETRY_MS; // reset backoff on success
      updateState("connected");
    };

    ws.onmessage = (evt) => {
      try {
        const event = JSON.parse(evt.data as string) as WsPageantEvent;
        onEventRef.current?.(event);
      } catch {
        // malformed frame — ignore
      }
    };

    ws.onclose = () => {
      if (stoppedRef.current) {
        updateState("disconnected");
        return;
      }
      updateState("reconnecting");
      retryTimeoutRef.current = setTimeout(() => {
        retryDelayRef.current = Math.min(
          retryDelayRef.current * BACKOFF_FACTOR,
          MAX_RETRY_MS,
        );
        connect();
      }, retryDelayRef.current);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [pageantId, updateState]);

  const disconnect = useCallback(() => {
    stoppedRef.current = true;
    if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    wsRef.current?.close();
    updateState("disconnected");
  }, [updateState]);

  const reconnect = useCallback(() => {
    stoppedRef.current = false;
    if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    wsRef.current?.close();
    connect();
  }, [connect]);

  useEffect(() => {
    if (!enabled) return;
    stoppedRef.current = false;
    connect();

    return () => {
      stoppedRef.current = true;
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      wsRef.current?.close();
    };
  }, [enabled, connect]);

  return { connectionState, disconnect, reconnect };
}
