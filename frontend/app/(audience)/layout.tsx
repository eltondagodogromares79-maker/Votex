import { RouteGuard } from "@/src/features/auth/components/RouteGuard";
import { DashboardShell } from "@/src/components/layout/DashboardShell";
import type { NavItem } from "@/src/config/nav";
import FirstLoginPasswordBanner from "@/src/features/auth/components/FirstLoginPasswordBanner";

const audienceNav: NavItem[] = [
  { label: "Dashboard", href: "/audience", icon: "home", exact: true },
  { label: "Live Pageants", href: "/audience/pageants", icon: "crown" },
  { label: "My Votes", href: "/audience/votes", icon: "star" },
  { label: "Notifications", href: "/audience/notifications", icon: "notifications" },
  { label: "Security", href: "/audience/account/security", icon: "settings" },
  { label: "Account", href: "/account/delete", icon: "settings" },
];

export default function AudienceLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard allowedRole="audience" loginPath="/login">
      <>
        <FirstLoginPasswordBanner />
        <DashboardShell extraItems={audienceNav}>{children}</DashboardShell>
      </>
    </RouteGuard>
  );
}
