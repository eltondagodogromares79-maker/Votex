"use client";

import AdminPageShell from "@/src/features/admin/components/AdminPageShell";
import AdminEmptyState from "@/src/features/admin/components/AdminEmptyState";

export default function AdminAnnouncementsPage() {
  return (
    <AdminPageShell title="Announcements" subtitle="Platform announcements."
      breadcrumbs={[{ label: "Dashboard", href: "/admin/dashboard" }, { label: "Announcements" }]}>
      <AdminEmptyState heading="No data yet" description="Announcements coming soon." />
    </AdminPageShell>
  );
}
