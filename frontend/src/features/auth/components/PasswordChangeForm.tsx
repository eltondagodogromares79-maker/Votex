"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/Button";
import { useSession } from "../context/SessionContext";
import { useChangePassword } from "../hooks/useChangePassword";

const inputClass = "h-10 w-full border border-border bg-surface px-3 text-sm text-charcoal focus:border-navy focus:outline-none disabled:opacity-60";
const labelClass = "mb-1.5 block text-sm font-medium text-charcoal";

export default function PasswordChangeForm() {
  const { currentUser, setCurrentUser } = useSession();
  const changePassword = useChangePassword();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    if (newPassword !== confirmPassword) {
      setFeedback({ type: "error", message: "The new password and confirmation do not match." });
      return;
    }
    if (currentPassword === newPassword) {
      setFeedback({ type: "error", message: "Choose a new password that differs from your current password." });
      return;
    }

    try {
      const result = await changePassword.mutateAsync({ currentPassword, newPassword });
      if (currentUser) setCurrentUser({ ...currentUser, mustChangePassword: false });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setFeedback({ type: "success", message: result.message || "Your password has been changed." });
    } catch (error) {
      setFeedback({ type: "error", message: error instanceof Error ? error.message : "Could not change your password. Try again." });
    }
  }

  return (
    <section className="overflow-hidden border border-border bg-surface">
      <div className="border-b border-border px-5 py-4 sm:px-6">
        <h2 className="font-serif text-lg font-semibold text-charcoal">Change password</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted">Use your current password to set a new password for your account.</p>
      </div>
      <form onSubmit={(event) => void submit(event)} className="space-y-5 px-5 py-5 sm:px-6">
        {currentUser?.mustChangePassword ? (
          <div className="border-l-4 border-gold bg-navy px-4 py-4 text-white">
            <p className="text-xs font-bold uppercase tracking-wider text-gold">First login action</p>
            <p className="mt-1 text-sm leading-relaxed">Change the temporary password before continuing to use your account.</p>
          </div>
        ) : null}
        {feedback ? <div role={feedback.type === "error" ? "alert" : "status"} className={`border px-4 py-3 text-sm ${feedback.type === "error" ? "border-error/30 bg-error/5 text-error" : "border-success/30 bg-success/5 text-success"}`}>{feedback.message}</div> : null}
        <div className="max-w-xl">
          <label className={labelClass} htmlFor="account-current-password">Current password <span className="text-error">*</span></label>
          <input id="account-current-password" type="password" autoComplete="current-password" required value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className={inputClass} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="account-new-password">New password <span className="text-error">*</span></label>
            <input id="account-new-password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="account-confirm-password">Confirm new password <span className="text-error">*</span></label>
            <input id="account-confirm-password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className={inputClass} />
          </div>
        </div>
        <div className="border border-border bg-slate/40 px-4 py-3">
          <p className="text-xs font-semibold text-charcoal">Password requirements</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">8–128 characters, with at least one uppercase letter, one lowercase letter, one number, and one special character.</p>
        </div>
        <Button type="submit" variant="secondary" size="sm" loading={changePassword.isPending} disabled={changePassword.isPending}>Change password</Button>
      </form>
    </section>
  );
}
