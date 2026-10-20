import AdminSidebar from "@/src/features/admin/components/AdminSidebar";
import { RouteGuard } from "@/src/features/auth/components/RouteGuard";
import FirstLoginPasswordBanner from "@/src/features/auth/components/FirstLoginPasswordBanner";
import { ResponsivePortalNav } from "@/src/components/layout/ResponsivePortalNav";
import LogoutButton from "@/src/features/auth/components/LogoutButton";

const adminNavigation = [
  { label: "Dashboard", href: "/admin/dashboard" },
  { label: "Organizations", href: "/admin/organizations" },
  { label: "Users", href: "/admin/users" },
  { label: "Pageants", href: "/admin/pageants" },
  { label: "Subscriptions", href: "/admin/finance/subscriptions" },
  { label: "Transactions", href: "/admin/finance/payments" },
  { label: "Plans", href: "/admin/finance/plans" },
  { label: "Reports", href: "/admin/moderation/reports" },
  { label: "Audit Logs", href: "/admin/moderation/audit-logs" },
  { label: "Settings", href: "/admin/system/settings" },
  { label: "Announcements", href: "/admin/system/announcements" },
  { label: "Contact Messages", href: "/admin/support/messages" },
  { label: "Profile", href: "/admin/account/profile" },
  { label: "Security", href: "/admin/account/security" },
  { label: "Notifications", href: "/admin/notifications" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard allowedRole="admin" loginPath="/login/platform-admin/v1">
      <div className="flex min-h-screen min-w-0 bg-slate">
        <AdminSidebar />
        <main className="min-h-screen min-w-0 flex-1 overflow-x-hidden">
          <ResponsivePortalNav
            title="Admin"
            items={adminNavigation}
            footer={<LogoutButton loginPath="/login/platform-admin/v1" className="flex min-h-11 w-full items-center gap-3 px-3 text-sm font-semibold text-red-300 hover:bg-red-500/10" />}
          />
          <FirstLoginPasswordBanner />
          {children}
        </main>
      </div>
    </RouteGuard>
  );
}
