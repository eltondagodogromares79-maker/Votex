"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/src/components/ui/Button";
import { Modal } from "@/src/components/ui/Modal";
import { useSession } from "@/src/features/auth/context/SessionContext";
import { authApi } from "@/src/features/auth/api/authentication";
import { ApiError, setAccessToken } from "@/src/lib/api/client";

export default function DeleteAccountPanel() {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const { setCurrentUser } = useSession();
  const queryClient = useQueryClient();
  const router = useRouter();

  async function deleteAccount() {
    setPending(true);
    setError(null);
    try {
      await authApi.deleteMyAccount({ currentPassword: password, confirmation });
      setAccessToken(null);
      document.cookie = "at_hint=; path=/; SameSite=Lax; Max-Age=0";
      setCurrentUser(null);
      queryClient.clear();
      router.replace("/");
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.userMessage : cause instanceof Error ? cause.message : "Could not delete the account. Please try again.");
      setPending(false);
    }
  }

  return <>
    <section className="border border-error/30 bg-surface overflow-hidden">
      <header className="border-b border-error/30 bg-error/5 px-6 py-4">
        <h3 className="font-serif font-semibold text-error text-h3">Delete account</h3>
        <p className="mt-1 text-small text-muted">This signs you out and permanently disables your account.</p>
      </header>
      <div className="space-y-4 px-6 py-5">
        <p className="max-w-3xl text-small leading-relaxed text-muted">Your personal profile and sign-in methods will be removed. Organizations you own and their pageants will be deactivated and unpublished. Scores, payments, and audit history are retained with your identity anonymized so existing records remain consistent.</p>
        <Button variant="danger" size="sm" onClick={() => { setError(null); setOpen(true); }}>Delete my account</Button>
      </div>
    </section>
    <Modal open={open} onClose={() => !pending && setOpen(false)} title="Permanently delete your account?" description="This cannot be undone. Enter your current password and type DELETE to confirm." size="md" footer={<>
      <Button variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={pending}>Keep my account</Button>
      <Button variant="danger" size="sm" onClick={() => void deleteAccount()} loading={pending} disabled={pending || !password || confirmation !== "DELETE"}>Delete account</Button>
    </>}>
      <div className="space-y-4">
        <label className="block text-small font-medium text-charcoal">Current password<input autoComplete="current-password" type="password" value={password} onChange={event => setPassword(event.target.value)} className="mt-1.5 h-10 w-full border border-border bg-surface px-3 text-small text-charcoal focus:border-navy focus:outline-none" /></label>
        <label className="block text-small font-medium text-charcoal">Type DELETE to confirm<input autoComplete="off" value={confirmation} onChange={event => setConfirmation(event.target.value)} className="mt-1.5 h-10 w-full border border-border bg-surface px-3 text-small text-charcoal focus:border-navy focus:outline-none" /></label>
        {error && <p role="alert" className="border border-error/25 bg-error/5 px-3 py-2 text-small text-error">{error}</p>}
      </div>
    </Modal>
  </>;
}
