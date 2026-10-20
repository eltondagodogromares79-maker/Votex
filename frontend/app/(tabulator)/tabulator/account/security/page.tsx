import Link from "next/link";
import PasswordChangeForm from "@/src/features/auth/components/PasswordChangeForm";

export default function TabulatorSecurityPage() {
  return (
    <div className="min-h-screen">
      <section className="border-b border-gold/25 bg-navy py-10 text-white sm:py-12">
        <div className="container-page">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Tabulator workspace</p>
          <h1 className="mt-2 font-serif text-3xl font-bold sm:text-4xl">Security</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/60">Keep your account secure by choosing a password only you know.</p>
          <nav aria-label="Breadcrumb" className="mt-5"><ol className="flex items-center gap-2 text-xs text-white/45"><li><Link href="/tabulator" className="transition-colors hover:text-gold">Dashboard</Link></li><li aria-hidden="true">/</li><li className="text-white/75">Security</li></ol></nav>
        </div>
      </section>
      <div className="container-page space-y-6 py-6"><PasswordChangeForm /></div>
    </div>
  );
}
