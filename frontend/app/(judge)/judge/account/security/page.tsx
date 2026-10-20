import Link from "next/link";
import PasswordChangeForm from "@/src/features/auth/components/PasswordChangeForm";

export default function JudgeSecurityPage() {
  return (
    <div className="flex min-h-[calc(100vh-76px)] flex-col">
      <section className="relative isolate overflow-hidden border-b border-gold/25 bg-navy py-12 text-white sm:py-14">
        <div className="container-page relative">
          <p className="mb-3 text-caption font-semibold uppercase tracking-[0.18em] text-gold">Judge workspace</p>
          <h1 className="font-serif text-[1.875rem] font-bold leading-tight sm:text-4xl">Security</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/60">Keep your account secure by choosing a password only you know.</p>
          <nav aria-label="Breadcrumb" className="mt-5"><ol className="flex items-center gap-2 text-caption text-white/45"><li><Link href="/judge" className="transition-colors hover:text-gold">My pageants</Link></li><li aria-hidden="true">/</li><li className="text-white/75">Security</li></ol></nav>
        </div>
      </section>
      <div className="container-page w-full flex-1 space-y-6 py-6"><PasswordChangeForm /></div>
    </div>
  );
}
