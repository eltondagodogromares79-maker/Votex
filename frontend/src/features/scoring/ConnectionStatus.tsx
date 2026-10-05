import { cn } from "@/src/lib/utils";
import { COPY } from "@/src/content/copy";
import type { WsConnectionState } from "@/src/types/realtime";

interface ConnectionStatusProps {
  state: WsConnectionState;
  onReconnect?: () => void;
}

export function ConnectionStatus({ state, onReconnect }: ConnectionStatusProps) {
  if (state === "connected") return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-center justify-between gap-2 px-4 py-2 text-small",
        state === "reconnecting" && "bg-gold/10 text-charcoal",
        state === "disconnected" || state === "error"
          ? "bg-error/10 text-error"
          : "",
        state === "connecting" && "bg-navy/5 text-muted",
      )}
    >
      <div className="flex items-center gap-2">
        {state === "reconnecting" && (
          <svg className="animate-spin h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        <span>
          {state === "connecting" && "Connecting…"}
          {state === "reconnecting" && COPY.tabulation.reconnecting}
          {(state === "disconnected" || state === "error") && COPY.tabulation.disconnected}
        </span>
      </div>
      {(state === "disconnected" || state === "error") && onReconnect && (
        <button
          onClick={onReconnect}
          className="text-small font-medium text-navy underline hover:no-underline"
        >
          {COPY.actions.retry}
        </button>
      )}
    </div>
  );
}
