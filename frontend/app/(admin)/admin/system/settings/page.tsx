import AdminEmptyState from "@/src/features/admin/components/AdminEmptyState";
import AdminPageShell from "@/src/features/admin/components/AdminPageShell";

/**
 * System settings are intentionally unavailable until each setting has a
 * domain owner, validated command, persistence model, and audit trail.
 */
export default function AdminSystemSettingsPage() {
  return (
    <AdminPageShell
      title="Platform Settings"
      subtitle="Controlled platform configuration."
      breadcrumbs={[
        { label: "Dashboard", href: "/admin/dashboard" },
        { label: "System" },
        { label: "Settings" },
      ]}
    >
      <div className="border border-border bg-surface">
        <AdminEmptyState
          heading="No configurable settings"
          description="System configuration is not exposed until it has secure persistence, validation, and audit coverage. No settings are simulated in this panel."
        />
      </div>
    </AdminPageShell>
  );
}
