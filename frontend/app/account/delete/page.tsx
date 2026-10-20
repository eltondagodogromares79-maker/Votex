"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import DeleteAccountPanel from "@/src/features/auth/components/DeleteAccountPanel";
import { useSession } from "@/src/features/auth/context/SessionContext";

export default function AccountDeletionPage() {
  const { currentUser, isReady } = useSession();
  const router = useRouter();
  useEffect(() => {
    if (isReady && !currentUser) router.replace("/login?redirect=%2Faccount%2Fdelete");
  }, [currentUser, isReady, router]);
  if (!isReady || !currentUser) return <main className="min-h-screen bg-slate" />;
  return <main className="min-h-screen bg-slate px-4 py-12 sm:px-6 lg:px-8">
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="text-caption font-semibold uppercase tracking-[0.16em] text-navy">Account settings</p>
        <h1 className="mt-2 font-serif text-h1 font-bold text-charcoal">Delete your account</h1>
        <p className="mt-2 text-small text-muted">Signed in as {currentUser.email}</p>
      </div>
      <DeleteAccountPanel />
    </div>
  </main>;
}
