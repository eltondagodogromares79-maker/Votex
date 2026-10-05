import { RouteGuard } from "@/src/features/auth/components/RouteGuard";
import { DashboardShell } from "@/src/components/layout/DashboardShell";

export default function AudienceLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard allowedRole="audience" loginPath="/login/audience">
      <DashboardShell>{children}</DashboardShell>
    </RouteGuard>
  );
}
