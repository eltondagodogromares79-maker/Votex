"use client";

import AdminEmptyState from "@/src/features/admin/components/AdminEmptyState";
import AdminPageShell from "@/src/features/admin/components/AdminPageShell";

/**
 * No report storage or moderation API exists in the current Votex domain.
 * Deliberately show no data rather than presenting fabricated reports.
 */
export default function AdminReportsPage() {
  return (
    <AdminPageShell
      title="Reports"
      subtitle="Platform reports and moderation cases."
      breadcrumbs={[
        { label: "Dashboard", href: "/admin/dashboard" },
        { label: "Moderation" },
        { label: "Reports" },
      ]}
    >
      <div className="border border-border bg-surface">
        <AdminEmptyState
          heading="Reporting is not configured"
          description="This deployment does not yet provide a report repository or moderation workflow. No placeholder reports are displayed."
        />
      </div>
    </AdminPageShell>
  );
}
