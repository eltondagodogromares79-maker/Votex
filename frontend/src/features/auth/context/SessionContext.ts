import { createContext, useContext } from "react";
import type { CurrentUser } from "../api/authentication";

export interface SessionState {
  /** The authenticated user. Null while loading or when not logged in. */
  currentUser: CurrentUser | null;
  /** True only during the initial session restore on mount. */
  isLoading: boolean;
  /** True once the initial restore attempt has completed (success or failure). */
  isReady: boolean;
  /** Update the in-memory user — called by useLogin after successful login. */
  setCurrentUser: (user: CurrentUser | null) => void;
}

export const SessionContext = createContext<SessionState | null>(null);

/** Read the session context. Must be used inside <SessionProvider>. */
export function useSession(): SessionState {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside <SessionProvider>");
  return ctx;
}
