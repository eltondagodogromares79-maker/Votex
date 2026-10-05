import axios, { type InternalAxiosRequestConfig } from "axios";

export const api = axios.create({
  // Empty baseURL — all requests go through the Next.js dev server.
  // app/api/v1/[...path]/route.ts forwards them to the Rust backend
  // and explicitly preserves the Authorization header.
  baseURL: "",
  headers: {
    "Content-Type": "application/json",
  },
  // Sends the HttpOnly refresh_token cookie with every request.
  withCredentials: true,
});

// ─────────────────────────────────────────────────────────────────────────────
// Case conversion helpers
// ─────────────────────────────────────────────────────────────────────────────

function toSnakeCase(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(toSnakeCase);
  if (value === null || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`),
      toSnakeCase(item),
    ]),
  );
}

function toCamelCase(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(toCamelCase);
  if (value === null || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key.replace(/_([a-z])/g, (_match, letter: string) => letter.toUpperCase()),
      toCamelCase(item),
    ]),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ApiError
// ─────────────────────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }

  get userMessage(): string {
    if (
      typeof this.body === "object" &&
      this.body !== null &&
      "message" in this.body &&
      typeof (this.body as Record<string, unknown>).message === "string"
    ) {
      return (this.body as Record<string, unknown>).message as string;
    }
    return this.message;
  }

  get code(): string | null {
    if (
      typeof this.body === "object" &&
      this.body !== null &&
      "code" in this.body &&
      typeof (this.body as Record<string, unknown>).code === "string"
    ) {
      return (this.body as Record<string, unknown>).code as string;
    }
    return null;
  }

  get requestId(): string | null {
    if (
      typeof this.body === "object" &&
      this.body !== null &&
      "requestId" in this.body &&
      typeof (this.body as Record<string, unknown>).requestId as string
    ) {
      return (this.body as Record<string, unknown>).requestId as string;
    }
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Access token (in-memory only — never localStorage or readable cookie)
// ─────────────────────────────────────────────────────────────────────────────

let _accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  _accessToken = token;
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
}

export function getAccessToken(): string | null {
  return _accessToken;
}

// ─────────────────────────────────────────────────────────────────────────────
// Token refresh state
//
// isRefreshing: true while a refresh call is in-flight — prevents a second
//   concurrent refresh from being triggered by parallel 401 responses.
//
// refreshQueue: requests that arrived while a refresh was in-flight.
//   On refresh success they are retried with the new token.
//   On refresh failure they are rejected with the original error.
// ─────────────────────────────────────────────────────────────────────────────

let isRefreshing = false;

type QueueEntry = {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
};

const refreshQueue: QueueEntry[] = [];

function drainQueue(token: string): void {
  refreshQueue.splice(0).forEach((entry) => entry.resolve(token));
}

function rejectQueue(error: unknown): void {
  refreshQueue.splice(0).forEach((entry) => entry.reject(error));
}

/** Wait for the in-flight refresh to complete, then return the new token. */
function waitForRefresh(): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    refreshQueue.push({ resolve, reject });
  });
}

/** Redirect to login and clear all auth state. */
function forceLogout(): void {
  setAccessToken(null);
  document.cookie = "at_hint=; path=/; Max-Age=0";
  // Use replace so the user can't press Back to get to the broken page.
  window.location.replace("/login");
}

// ─────────────────────────────────────────────────────────────────────────────
// Request interceptor — attach current token (handles token set after creation)
// ─────────────────────────────────────────────────────────────────────────────

api.interceptors.request.use((config) => {
  // Convert camelCase body fields to snake_case before sending to Rust backend
  if (config.data) {
    config.data = toSnakeCase(config.data);
  }
  return config;
});

// ─────────────────────────────────────────────────────────────────────────────
// Response interceptor — camelCase conversion + 401 auto-refresh
// ─────────────────────────────────────────────────────────────────────────────

api.interceptors.response.use(
  (response) => {
    // Convert snake_case response fields to camelCase for the frontend
    if (response.data && typeof response.data === "object") {
      response.data = toCamelCase(response.data);
    }
    return response;
  },

  async (error) => {
    if (!axios.isAxiosError(error)) throw error;

    const status = error.response?.status ?? 0;
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retried?: boolean;
    };

    // ── 401 auto-refresh logic ────────────────────────────────────────────────
    //
    // Attempt a token refresh when:
    //   • The response was 401 (Unauthorized)
    //   • This request hasn't already been retried (prevents infinite loops)
    //   • The failing request was NOT itself the refresh call (prevents loops)
    //
    const isRefreshCall = originalRequest.url?.includes("/auth/refresh");

    if (status === 401 && !originalRequest._retried && !isRefreshCall) {
      originalRequest._retried = true;

      if (isRefreshing) {
        // Another refresh is already in-flight — queue this request and wait.
        try {
          const newToken = await waitForRefresh();
          originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
          return api(originalRequest);
        } catch {
          throw buildApiError(error);
        }
      }

      // This is the first 401 — kick off the refresh.
      isRefreshing = true;

      try {
        // POST /api/v1/auth/refresh — uses the HttpOnly cookie automatically.
        const refreshResponse = await api.post<{ accessToken: string }>(
          "/api/v1/auth/refresh",
        );

        const newToken = refreshResponse.data.accessToken;
        setAccessToken(newToken);
        drainQueue(newToken);

        // Retry the original request with the new token.
        originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed — session is dead. Log the user out.
        rejectQueue(refreshError);
        forceLogout();
        throw buildApiError(error);
      } finally {
        isRefreshing = false;
      }
    }

    // ── All other errors ──────────────────────────────────────────────────────
    throw buildApiError(error);
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// Helper — build ApiError from an AxiosError
// ─────────────────────────────────────────────────────────────────────────────

function buildApiError(error: ReturnType<typeof axios.isAxiosError> extends true ? never : unknown): ApiError;
function buildApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status ?? 0;
    const raw = error.response?.data;
    // Response data may already be camelCased by the success interceptor above,
    // but for error responses we convert here as well for safety.
    const body = raw && typeof raw === "object" ? toCamelCase(raw) : raw;

    let message = `HTTP ${status}`;
    if (
      typeof body === "object" &&
      body !== null &&
      "message" in body &&
      typeof (body as Record<string, unknown>).message === "string"
    ) {
      message = (body as Record<string, unknown>).message as string;
    }

    return new ApiError(status, body, message);
  }
  return new ApiError(0, null, "Network error");
}
