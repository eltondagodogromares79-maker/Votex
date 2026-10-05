import Sidebar from "@/src/features/org_owner/components/OrgSidebar";
import { RouteGuard } from "@/src/features/auth/components/RouteGuard";

export default function OrgOwnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard allowedRole="org_owner" loginPath="/login/org-owner">
      <div className="flex min-h-screen bg-slate">
        <Sidebar />
        <main className="flex-1 min-w-0 overflow-auto">
          {children}
        </main>
      </div>
    </RouteGuard>
  );
}
