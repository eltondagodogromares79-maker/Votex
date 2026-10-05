"use client";

import { PageShell } from "@/src/components/layout/PageShell";
import { EmptyState, ListEmptyIcon } from "@/src/components/ui/EmptyState";

export default function AudienceVotesPage() {
  return (
    <PageShell
      title="My Votes"
      breadcrumbs={[{ label: "Home", href: "/audience" }, { label: "My Votes" }]}
    >
      <EmptyState
        icon={<ListEmptyIcon />}
        heading="No votes yet"
        description="Your vote history will appear here after you participate in an audience voting campaign."
      />
    </PageShell>
  );
}
