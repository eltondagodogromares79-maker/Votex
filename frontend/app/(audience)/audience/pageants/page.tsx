"use client";

import { PageShell } from "@/src/components/layout/PageShell";
import { EmptyState, ListEmptyIcon } from "@/src/components/ui/EmptyState";

export default function AudiencePageantsPage() {
  return (
    <PageShell
      title="Live Pageants"
      breadcrumbs={[{ label: "Home", href: "/audience" }, { label: "Live Pageants" }]}
    >
      <EmptyState
        icon={<ListEmptyIcon />}
        heading="No live pageants right now"
        description="Live events and vote tallies will appear here. Check back during an active event."
      />
    </PageShell>
  );
}
