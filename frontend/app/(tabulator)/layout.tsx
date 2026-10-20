import { RouteGuard } from "@/src/features/auth/components/RouteGuard";
import TabulatorHeader from "@/src/features/tabulator/components/TabulatorHeader";

export default function TabulatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard allowedRole="tabulator" loginPath="/login">
      <div className="flex min-h-screen flex-col bg-slate">
        <TabulatorHeader />
        <main className="min-h-[calc(100vh-76px)] min-w-0 flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>
    </RouteGuard>
  );
}
