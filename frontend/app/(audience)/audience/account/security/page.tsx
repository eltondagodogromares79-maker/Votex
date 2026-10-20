import Link from "next/link";
import PasswordChangeForm from "@/src/features/auth/components/PasswordChangeForm";

export default function AudienceSecurityPage() {
  return (
    <div className="container-page space-y-6 py-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-navy">Account settings</p>
        <h1 className="mt-2 font-serif text-3xl font-bold text-charcoal">Security</h1>
        <p className="mt-2 text-sm text-muted"><Link href="/audience" className="text-navy underline">Dashboard</Link> / Security</p>
      </div>
      <PasswordChangeForm />
    </div>
  );
}
