"use client";

import OrgPageShell from "@/src/features/org_owner/components/OrgPageShell";

export default function OrgOwnerSettingsPage() {
  return (
    <OrgPageShell
      title="Settings"
      subtitle="Organization profile and preferences."
      breadcrumbs={[{ label: "Dashboard", href: "/org_owner/dashboard" }, { label: "Settings" }]}
    >
      <p className="text-small text-muted">Settings coming soon.</p>
    </OrgPageShell>
  );
}
