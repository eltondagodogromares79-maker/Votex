"use client";

import { useEffect } from "react";
import { Button } from "@/src/components/ui/Button";
import { COPY } from "@/src/content/copy";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate flex items-center justify-center px-4">
      <div className="text-center max-w-md">
          <h1 className="text-h1 font-serif text-charcoal mb-3">Something went wrong</h1>
          <p className="text-body text-muted mb-6">{COPY.errors.generic}</p>
          {error.digest && (
            <p className="text-caption text-muted/60 mb-4 font-mono">
              Error ID: {error.digest}
            </p>
          )}
          <Button variant="primary" size="md" onClick={reset}>
            {COPY.actions.retry}
          </Button>
      </div>
    </div>
  );
}
