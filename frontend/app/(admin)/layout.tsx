import AdminSidebar from "@/src/features/admin/components/AdminSidebar";
import { RouteGuard } from "@/src/features/auth/components/RouteGuard";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard allowedRole="admin" loginPath="/login">
      <div className="flex min-h-screen bg-slate">
        <AdminSidebar />
        <main className="flex-1 min-h-screen overflow-auto">
          {children}
        </main>
      </div>
    </RouteGuard>
  );
}
