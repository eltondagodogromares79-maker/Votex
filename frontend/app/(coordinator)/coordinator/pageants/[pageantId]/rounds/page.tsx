"use client";

import { use } from "react";
import CoordinatorPageShell from "@/src/features/coordinator/components/CoordinatorPageShell";

export default function RoundsPage({ params }: { params: Promise<{ pageantId: string }> }) {
  const { pageantId } = use(params);
  return (
    <CoordinatorPageShell title="Rounds" breadcrumbs={[{ label: "Pageants", href: "/coordinator/pageants" }, { label: "Rounds" }]}>
      <p className="text-small text-muted">Rounds for pageant <strong>{pageantId}</strong> — coming soon.</p>
    </CoordinatorPageShell>
  );
}
