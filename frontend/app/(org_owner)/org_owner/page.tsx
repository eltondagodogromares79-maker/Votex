"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OrgOwnerRootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/org_owner/dashboard");
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate px-4">
      <div className="flex items-center gap-3 text-sm text-muted" role="status" aria-live="polite">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-navy/20 border-t-gold" />
        Opening your organization dashboard…
      </div>
    </main>
  );
}
