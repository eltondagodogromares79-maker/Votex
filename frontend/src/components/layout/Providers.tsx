"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { ToastProvider } from "@/src/components/ui/Toast";
import { SessionProvider } from "@/src/features/auth/components/SessionProvider";

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
        <ToastProvider>{children}</ToastProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}
