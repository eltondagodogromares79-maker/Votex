"use client";

import { use } from "react";
import { PageShell } from "@/src/components/layout/PageShell";
import { Card } from "@/src/components/ui/Card";

export default function JudgeScoringPage({
  params,
}: {
  params: Promise<{ pageantId: string }>;
}) {
  const { pageantId } = use(params);

  return (
    <PageShell
      title="Scoring"
      breadcrumbs={[{ label: "My Assignments", href: "/judge" }, { label: "Score" }]}
    >
      <Card padding="lg">
        <p className="text-body text-muted">
          Scoring for pageant <strong>{pageantId}</strong> — coming soon.
        </p>
      </Card>
    </PageShell>
  );
}
