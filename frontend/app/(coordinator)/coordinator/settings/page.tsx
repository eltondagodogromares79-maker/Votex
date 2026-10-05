import Link from "next/link";
import CoordinatorPageShell from "@/src/features/coordinator/components/CoordinatorPageShell";

const SETTINGS_CATEGORIES = [
  {
    title: "Profile",
    description: "Manage your coordinator profile and preferences",
    href: "/coordinator/account/profile",
    icon: "👤",
  },
  {
    title: "Security",
    description: "Password, 2FA, and login activity",
    href: "/coordinator/account/security",
    icon: "🔒",
  },
];

export default function CoordinatorSettingsPage() {
  return (
    <CoordinatorPageShell
      title="Settings"
      subtitle="Manage your coordinator account and preferences."
      breadcrumbs={[
        { label: "Dashboard", href: "/coordinator/dashboard" },
        { label: "Settings" },
      ]}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
        {SETTINGS_CATEGORIES.map((category) => (
          <Link key={category.href} href={category.href}
            className="bg-surface border border-border overflow-hidden hover:border-navy transition-colors group">
            <div className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl" aria-hidden="true">{category.icon}</span>
                <h3 className="font-serif font-semibold text-charcoal group-hover:text-navy transition-colors">
                  {category.title}
                </h3>
              </div>
              <p className="text-small text-muted leading-relaxed">{category.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </CoordinatorPageShell>
  );
}