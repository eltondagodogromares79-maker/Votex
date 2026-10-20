"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { useCallback } from "react";
import { usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ToastProvider } from "@/src/components/ui/Toast";
import { SessionProvider } from "@/src/features/auth/components/SessionProvider";
import { useSession } from "@/src/features/auth/context/SessionContext";
import { usePageantRealtime } from "@/src/lib/realtime/usePageantRealtime";

function RealtimeQueryBridge() {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { currentUser } = useSession();
  const match = pathname.match(/^\/(judge|coordinator|tabulator)\/pageants\/([^/]+)/);
  const routeRole = match?.[1];
  const pageantId = match?.[2] ?? "";
  const enabled = Boolean(match && currentUser?.role === routeRole);
  const onEvent = useCallback(() => {
    if (routeRole && pageantId) {
      void queryClient.invalidateQueries({ queryKey: [routeRole] });
    }
  }, [pageantId, queryClient, routeRole]);

  usePageantRealtime(pageantId, { enabled, onEvent });
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  // Create a stable QueryClient per browser session
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000, // 30s
            retry: (failureCount, error) => {
              // Don't retry on 401/403/404
              if (
                error instanceof Error &&
                "status" in error &&
                typeof (error as { status?: number }).status === "number"
              ) {
                const status = (error as { status: number }).status;
                if ([401, 403, 404].includes(status)) return false;
              }
              return failureCount < 2;
            },
          },
          mutations: {
            retry: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <ToastProvider>
          <RealtimeQueryBridge />
          {children}
        </ToastProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}
