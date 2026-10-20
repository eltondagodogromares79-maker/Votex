import Sidebar from "@/src/features/org_owner/components/OrgSidebar";
import { RouteGuard } from "@/src/features/auth/components/RouteGuard";
import FirstLoginPasswordBanner from "@/src/features/auth/components/FirstLoginPasswordBanner";
import { ResponsivePortalNav } from "@/src/components/layout/ResponsivePortalNav";
import LogoutButton from "@/src/features/auth/components/LogoutButton";

const orgOwnerNavigation = [
  { label: "Dashboard", href: "/org_owner/dashboard" },
  { label: "Pageants", href: "/org_owner/pageants" },
  { label: "Coordinator", href: "/org_owner/teams/coordinator" },
  { label: "Judges", href: "/org_owner/teams/judges" },
  { label: "Tabulator", href: "/org_owner/teams/tabulator" },
  { label: "My Subscription", href: "/org_owner/billing/subscription" },
  { label: "Plans and Pricing", href: "/org_owner/billing/plans" },
  { label: "Transaction History", href: "/org_owner/billing/transactions" },
  { label: "Activity Logs", href: "/org_owner/activity-logs" },
  { label: "Notifications", href: "/org_owner/notifications" },
  { label: "Accounts", href: "/org_owner/settings/accounts" },
  { label: "Security", href: "/org_owner/settings/security" },
  { label: "Contact and Support", href: "/org_owner/settings/support" },
];

export default function OrgOwnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard allowedRole="org_owner" loginPath="/login">
      <div className="flex min-h-screen min-w-0 bg-slate">
        <Sidebar />
        <main className="min-w-0 flex-1 overflow-x-hidden">
          <ResponsivePortalNav
            title="Organization"
            items={orgOwnerNavigation}
            footer={<LogoutButton loginPath="/login" className="flex min-h-11 w-full items-center gap-3 px-3 text-sm font-semibold text-red-300 hover:bg-red-500/10" />}
          />
          <FirstLoginPasswordBanner />
          {children}
        </main>
      </div>
    </RouteGuard>
  );
}
