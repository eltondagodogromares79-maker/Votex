"use client";

import OrgPageShell from "@/src/features/org_owner/components/OrgPageShell";
import OrgEmptyState from "@/src/features/org_owner/components/OrgEmptyState";

export default function OrgOwnerTeamPage() {
  return (
    <OrgPageShell
      title="Organization Members"
      subtitle="People with organization-level access."
      breadcrumbs={[{ label: "Dashboard", href: "/org_owner/dashboard" }, { label: "Members" }]}
    >
      <OrgEmptyState
        icon={<span className="text-2xl" aria-hidden="true">⌕</span>}
        heading="No members yet"
        description="Organization members will appear here."
      />
    </OrgPageShell>
  );
}
