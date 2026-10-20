"use client";

import { useState } from "react";
import CoordinatorPageShell from "@/src/features/coordinator/components/CoordinatorPageShell";
import CoordinatorBadge from "@/src/features/coordinator/components/CoordinatorBadge";
import { Button } from "@/src/components/ui/Button";
import { useSession } from "@/src/features/auth/context/SessionContext";
import { useMe } from "@/src/features/auth/hooks/useMe";
import { useChangePassword } from "@/src/features/auth/hooks/useChangePassword";

const fieldLabel = "block text-small font-medium text-charcoal mb-1.5";
const fieldInput = "w-full h-10 px-3 bg-surface border border-border text-small text-charcoal placeholder:text-muted focus:outline-none focus:border-navy transition-colors disabled:opacity-60";

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden border border-border bg-surface">
      <div className="border-b border-border px-5 py-4 sm:px-6">
        <h2 className="font-serif text-h3 font-semibold text-charcoal">{title}</h2>
        {description ? <p className="mt-0.5 text-small leading-relaxed text-muted">{description}</p> : null}
      </div>
      <div className="space-y-5 px-5 py-5 sm:px-6">{children}</div>
    </section>
  );
}

export default function SecurityPage() {
  const { currentUser, setCurrentUser } = useSession();
  const profileQuery = useMe();
  const changePassword = useChangePassword();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const mustChangePassword = profileQuery.data?.mustChangePassword ?? currentUser?.mustChangePassword ?? false;

  async function submitPasswordChange(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    if (newPassword !== confirmPassword) {
      setFeedback({ type: "error", message: "The new password and confirmation do not match." });
      return;
    }
    if (newPassword === currentPassword) {
      setFeedback({ type: "error", message: "Choose a new password that differs from your current password." });
      return;
    }

    try {
      const response = await changePassword.mutateAsync({ currentPassword, newPassword });
      if (currentUser) setCurrentUser({ ...currentUser, mustChangePassword: false });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setFeedback({ type: "success", message: response.message || "Your password has been changed." });
    } catch (error) {
      setFeedback({ type: "error", message: error instanceof Error ? error.message : "Could not change your password. Try again." });
    }
  }

  return (
    <CoordinatorPageShell
      hero
      title="Security"
      subtitle="Protect your account with a strong password."
      breadcrumbs={[{ label: "Assigned pageants", href: "/coordinator/pageants" }, { label: "Security" }]}
    >
      <div className="w-full space-y-6">
        {profileQuery.isError ? (
          <div role="alert" className="border border-error/30 bg-error/5 px-5 py-4 text-small text-error">Could not load your account security status. Refresh and try again.</div>
        ) : null}

        {mustChangePassword ? (
          <div className="border border-gold/35 border-l-4 border-l-gold bg-navy px-5 py-5 text-white shadow-sm sm:px-6">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gold">Action required</p>
            <h2 className="mt-1 font-serif text-xl font-semibold">Change your temporary password</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/70">Your coordinator account was created with temporary credentials. Set a password only you know to finish securing your account.</p>
          </div>
        ) : null}

        {feedback ? (
          <div role={feedback.type === "error" ? "alert" : "status"} className={`border px-4 py-3 text-small ${feedback.type === "error" ? "border-error/30 bg-error/5 text-error" : "border-success/30 bg-success/5 text-success"}`}>
            {feedback.message}
          </div>
        ) : null}

        <Section title="Change password" description="Use your current password to choose a new one for this account.">
          <form onSubmit={(event) => void submitPasswordChange(event)} className="space-y-5">
            <div className="max-w-xl">
              <label className={fieldLabel} htmlFor="current-password">Current password <span className="text-error">*</span></label>
              <input id="current-password" type="password" autoComplete="current-password" required value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className={fieldInput} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={fieldLabel} htmlFor="new-password">New password <span className="text-error">*</span></label>
                <input id="new-password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className={fieldInput} />
              </div>
              <div>
                <label className={fieldLabel} htmlFor="confirm-password">Confirm new password <span className="text-error">*</span></label>
                <input id="confirm-password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className={fieldInput} />
              </div>
            </div>
            <div className="border border-border bg-slate/40 px-4 py-3">
              <p className="text-xs font-semibold text-charcoal">Password requirements</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">8–128 characters, with at least one uppercase letter, one lowercase letter, one number, and one special character.</p>
            </div>
            <Button type="submit" variant="secondary" size="sm" loading={changePassword.isPending} disabled={changePassword.isPending || profileQuery.isLoading}>Change password</Button>
          </form>
        </Section>

        <Section title="Email verification" description="Check the verification status of the email connected to your coordinator account.">
          {profileQuery.isLoading ? (
            <p className="text-small text-muted">Loading email status…</p>
          ) : profileQuery.data?.emailVerifiedAt ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><p className="text-small font-semibold text-charcoal">{profileQuery.data.email}</p><p className="mt-1 text-caption text-muted">Your email address is verified.</p></div>
              <CoordinatorBadge variant="success">Verified</CoordinatorBadge>
            </div>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="text-small font-semibold text-charcoal">{profileQuery.data?.pendingEmail ?? profileQuery.data?.email ?? currentUser?.email}</p><p className="mt-1 text-caption text-muted">This email address has not been verified yet.</p></div>
              <CoordinatorBadge variant="warning">Not verified</CoordinatorBadge>
            </div>
          )}
        </Section>
      </div>
    </CoordinatorPageShell>
  );
}
