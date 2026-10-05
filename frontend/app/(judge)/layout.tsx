import Sidebar from "@/src/features/org_owner/components/OrgSidebar";
import { RouteGuard } from "@/src/features/auth/components/RouteGuard";

export default function JudgeLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard allowedRole="judge" loginPath="/login/judge">
      <div className="flex min-h-screen bg-slate">
        <Sidebar />
        <main className="flex-1 min-h-screen overflow-auto">
          {children}
        </main>
      </div>
    </RouteGuard>
  );
}
