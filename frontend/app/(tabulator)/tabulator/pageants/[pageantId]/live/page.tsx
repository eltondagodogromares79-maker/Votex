"use client";

import { use } from "react";
import { PageShell } from "@/src/components/layout/PageShell";
import { Card } from "@/src/components/ui/Card";

export default function TabulatorLivePage({
  params,
}: {
  params: Promise<{ pageantId: string }>;
}) {
  const { pageantId } = use(params);

  return (
    <PageShell
      title="Live Tabulation"
      breadcrumbs={[{ label: "My Assignments", href: "/tabulator" }, { label: "Live" }]}
    >
      <Card padding="lg">
        <p className="text-body text-muted">
          Live tabulation for pageant <strong>{pageantId}</strong> — coming soon.
        </p>
      </Card>
    </PageShell>
  );
}
