"use client";

import { use } from "react";
import CoordinatorPageShell from "@/src/features/coordinator/components/CoordinatorPageShell";

export default function CandidatesPage({ params }: { params: Promise<{ pageantId: string }> }) {
  const { pageantId } = use(params);
  return (
    <CoordinatorPageShell title="Candidates" breadcrumbs={[{ label: "Pageants", href: "/coordinator/pageants" }, { label: "Candidates" }]}>
      <p className="text-small text-muted">Candidates for pageant <strong>{pageantId}</strong> — coming soon.</p>
    </CoordinatorPageShell>
  );
}
