import Sidebar from "@/src/features/org_owner/components/OrgSidebar";
import { RouteGuard } from "@/src/features/auth/components/RouteGuard";

export default function TabulatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard allowedRole="tabulator" loginPath="/login/tabulator">
      <div className="flex min-h-screen bg-slate">
        <Sidebar />
        <main className="flex-1 min-h-screen overflow-auto">
          {children}
        </main>
      </div>
    </RouteGuard>
  );
}
