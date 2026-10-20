import { RouteGuard } from "@/src/features/auth/components/RouteGuard";
import JudgeHeader from "@/src/features/judge/components/JudgeHeader";

export default function JudgeLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard allowedRole="judge" loginPath="/login">
      <div className="flex min-h-screen flex-col bg-slate">
        <JudgeHeader />
        <main className="min-h-[calc(100vh-76px)] min-w-0 flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>
    </RouteGuard>
  );
}
