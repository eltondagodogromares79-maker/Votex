"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/src/features/coordinator/components/CoordinatorSidebar";
import { RouteGuard } from "@/src/features/auth/components/RouteGuard";
import { ResponsivePortalNav } from "@/src/components/layout/ResponsivePortalNav";

export default function CoordinatorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isStandaloneCoordinatorPage = [
    "/coordinator",
    "/coordinator/pageants",
    "/coordinator/notifications",
    "/coordinator/account/profile",
    "/coordinator/account/security",
  ].includes(pathname);
  const pageantId = pathname.match(/^\/coordinator\/pageants\/([^/]+)$/)?.[1];
  const pageantNavigation = pageantId
    ? [
        { label: "Overview", href: `/coordinator/pageants/${pageantId}?section=overview` },
        { label: "Leaderboards", href: `/coordinator/pageants/${pageantId}?section=leaderboards` },
        { label: "Candidates", href: `/coordinator/pageants/${pageantId}?section=candidates` },
        { label: "Rounds", href: `/coordinator/pageants/${pageantId}?section=rounds` },
        { label: "Categories", href: `/coordinator/pageants/${pageantId}?section=categories` },
        { label: "Judges", href: `/coordinator/pageants/${pageantId}?section=judges` },
        { label: "Tabulators", href: `/coordinator/pageants/${pageantId}?section=tabulators` },
        { label: "Settings", href: `/coordinator/pageants/${pageantId}?section=settings` },
      ]
    : [];
  return (
    <RouteGuard allowedRole="coordinator" loginPath="/login">
      <div className="flex min-h-screen min-w-0 bg-slate">
        {!isStandaloneCoordinatorPage && <Sidebar />}
        <main className="min-h-screen min-w-0 flex-1 overflow-x-hidden">
          {pageantId ? <ResponsivePortalNav title="Pageant dashboard" items={pageantNavigation} /> : null}
          {children}
        </main>
      </div>
    </RouteGuard>
  );
}
