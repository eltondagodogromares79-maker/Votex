import Sidebar from "@/src/features/coordinator/components/CoordinatorSidebar";
import { RouteGuard } from "@/src/features/auth/components/RouteGuard";

export default function CoordinatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard allowedRole="coordinator" loginPath="/login/coordinator">
      <div className="flex min-h-screen bg-slate">
        <Sidebar />
        <main className="flex-1 min-h-screen overflow-auto">
          {children}
        </main>
      </div>
    </RouteGuard>
  );
}
