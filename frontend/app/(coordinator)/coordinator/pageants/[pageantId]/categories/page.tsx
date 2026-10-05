"use client";

import { use } from "react";
import CoordinatorPageShell from "@/src/features/coordinator/components/CoordinatorPageShell";

export default function CategoriesPage({ params }: { params: Promise<{ pageantId: string }> }) {
  const { pageantId } = use(params);
  return (
    <CoordinatorPageShell title="Categories & Criteria" breadcrumbs={[{ label: "Pageants", href: "/coordinator/pageants" }, { label: "Categories" }]}>
      <p className="text-small text-muted">Categories for pageant <strong>{pageantId}</strong> — coming soon.</p>
    </CoordinatorPageShell>
  );
}
