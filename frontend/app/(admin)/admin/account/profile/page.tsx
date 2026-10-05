"use client";

import AdminPageShell from "@/src/features/admin/components/AdminPageShell";

export default function AdminProfilePage() {
  return (
    <AdminPageShell
      title="Profile"
      subtitle="Your administrator account details."
      breadcrumbs={[{ label: "Dashboard", href: "/admin/dashboard" }, { label: "Profile" }]}
    >
      <section className="max-w-3xl border border-border bg-surface p-6">
        <h2 className="font-serif text-h3 font-semibold text-charcoal">Account</h2>
        <p className="mt-4 text-small text-muted">
          Profile information will be available once the authenticated profile API is connected.
        </p>
      </section>
    </AdminPageShell>
  );
}
