"use client";

import AdminPageShell from "@/src/features/admin/components/AdminPageShell";
import AdminEmptyState from "@/src/features/admin/components/AdminEmptyState";

export default function AdminSecurityPage() {
  return (
    <AdminPageShell title="Security" subtitle="Administrator account security.">
      <div className="max-w-3xl border border-border bg-surface">
        <AdminEmptyState
          heading="Security controls coming soon"
          description="Password change, session management, and MFA enrollment will appear when their API workflows are implemented."
        />
      </div>
    </AdminPageShell>
  );
}
