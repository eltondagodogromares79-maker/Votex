"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/src/components/ui/Button";
import { CloudinaryImageUpload } from "@/src/components/ui/CloudinaryImageUpload";
import { useSession } from "@/src/features/auth/context/SessionContext";
import { useMe } from "@/src/features/auth/hooks/useMe";
import { useUpdateMe } from "@/src/features/auth/hooks/useUpdateMe";
import DeleteAccountPanel from "@/src/features/auth/components/DeleteAccountPanel";
import type { MeResponse, UpdateMeRequest } from "@/src/features/auth/api/authentication";

const fieldLabel = "block text-small text-charcoal font-medium mb-1.5";
const fieldInput = "w-full h-10 px-3 bg-surface border border-border text-small text-charcoal placeholder:text-muted focus:outline-none focus:border-navy transition-colors disabled:opacity-60";

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return <section className="overflow-hidden border border-border bg-surface">
    <div className="border-b border-border px-5 py-4 sm:px-6">
      <h2 className="font-serif text-h3 font-semibold text-charcoal">{title}</h2>
      {description ? <p className="mt-0.5 text-small leading-relaxed text-muted">{description}</p> : null}
    </div>
    <div className="space-y-5 px-5 py-5 sm:px-6">{children}</div>
  </section>;
}

function toDraft(profile: MeResponse): UpdateMeRequest {
  return { firstName: profile.firstName, middleName: profile.middleName, lastName: profile.lastName, phone: profile.phone, profileImageUrl: profile.profileImageUrl };
}

export default function JudgeProfilePage() {
  const { currentUser, setCurrentUser } = useSession();
  const profileQuery = useMe();
  const updateProfile = useUpdateMe();
  const [draft, setDraft] = useState<UpdateMeRequest | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => { if (profileQuery.data) setDraft(toDraft(profileQuery.data)); }, [profileQuery.data]);

  function setField<K extends keyof UpdateMeRequest>(field: K, value: UpdateMeRequest[K]) {
    setDraft(previous => previous ? { ...previous, [field]: value } : previous);
    setFeedback(null);
  }

  async function saveProfile() {
    if (!draft) return;
    if (!draft.firstName.trim() || !draft.lastName.trim()) {
      setFeedback({ type: "error", message: "First name and last name are required." });
      return;
    }
    try {
      const updated = await updateProfile.mutateAsync({
        ...draft,
        firstName: draft.firstName.trim(),
        middleName: draft.middleName?.trim() || null,
        lastName: draft.lastName.trim(),
        phone: draft.phone?.trim() || null,
      });
      setDraft(toDraft(updated));
      if (currentUser) setCurrentUser({
        ...currentUser,
        firstName: updated.firstName,
        lastName: updated.lastName,
        profileImageUrl: updated.profileImageUrl,
        emailVerifiedAt: updated.emailVerifiedAt,
        pendingEmail: updated.pendingEmail,
        mustChangePassword: updated.mustChangePassword,
      });
      setFeedback({ type: "success", message: "Your profile has been updated." });
    } catch (error) {
      setFeedback({ type: "error", message: error instanceof Error ? error.message : "Could not save your profile. Try again." });
    }
  }

  const saving = updateProfile.isPending || uploadingPhoto;
  const fullName = [draft?.firstName, draft?.middleName, draft?.lastName].filter(Boolean).join(" ");
  const initials = `${draft?.firstName?.[0] ?? ""}${draft?.lastName?.[0] ?? ""}`.toUpperCase() || "J";

  return <div className="flex min-h-[calc(100vh-76px)] flex-col">
    <section className="relative isolate overflow-hidden border-b border-gold/25 bg-navy py-12 text-white sm:py-14">
      <div className="container-page relative">
        <div className="pointer-events-none absolute -right-10 -top-36 -z-10 h-[360px] w-[360px] rounded-full border border-gold/10" />
        <p className="mb-3 text-caption font-semibold uppercase tracking-[0.18em] text-gold">Judge workspace</p>
        <h1 className="font-serif text-[1.625rem] font-bold leading-tight sm:text-[1.875rem] lg:text-[2.25rem]">Profile</h1>
        <p className="mt-3 max-w-2xl text-small leading-relaxed text-white/60">Manage the personal information used across your judge account.</p>
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <nav aria-label="Breadcrumb"><ol className="flex items-center gap-2 text-caption text-white/45"><li><Link href="/judge" className="transition-colors hover:text-gold">My pageants</Link></li><li aria-hidden="true">/</li><li className="text-white/75">Profile</li></ol></nav>
          <Link href="/judge/account/security" className="text-caption font-semibold text-gold underline decoration-gold/50 underline-offset-4 hover:text-white">Account security</Link>
        </div>
      </div>
    </section>

    <div className="container-page w-full flex-1 space-y-6 py-6">
      {profileQuery.isLoading ? <div className="space-y-4" aria-label="Loading profile"><div className="h-32 animate-pulse border border-border bg-slate" /><div className="h-72 animate-pulse border border-border bg-slate" /></div>
        : profileQuery.isError || !profileQuery.data || !draft ? <div role="alert" className="border border-error/30 bg-error/5 px-5 py-4"><p className="text-small font-semibold text-error">Could not load your profile</p><p className="mt-1 text-caption text-muted">Refresh the page and try again.</p></div>
          : <>
            {feedback ? <div role={feedback.type === "error" ? "alert" : "status"} className={`border px-4 py-3 text-small ${feedback.type === "error" ? "border-error/30 bg-error/5 text-error" : "border-success/30 bg-success/5 text-success"}`}>{feedback.message}</div> : null}
            <Section title="Profile photo" description="This image appears in your judge account and workspace.">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gold/30 bg-navy font-serif text-2xl font-bold text-gold">
                  {draft.profileImageUrl ? <img src={draft.profileImageUrl} alt={`${fullName || "Judge"} profile`} className="h-full w-full object-cover" /> : initials}
                </div>
                <div className="min-w-0 flex-1"><p className="text-small font-semibold text-charcoal">{fullName || "Judge"}</p><p className="mt-0.5 text-caption text-muted">{profileQuery.data.email}</p>
                  <div className="mt-3"><CloudinaryImageUpload folder="profile-images" value={draft.profileImageUrl} label="Upload photo" rounded onUploadingChange={setUploadingPhoto} onChange={url => setField("profileImageUrl", url || null)} /></div>
                </div>
              </div>
            </Section>
            <Section title="Personal information" description="These details are loaded from your account and saved to your profile.">
              <div className="grid gap-4 sm:grid-cols-2">
                <div><label className={fieldLabel} htmlFor="judge-first-name">First name <span className="text-error">*</span></label><input id="judge-first-name" autoComplete="given-name" value={draft.firstName} onChange={event => setField("firstName", event.target.value)} className={fieldInput} /></div>
                <div><label className={fieldLabel} htmlFor="judge-last-name">Last name <span className="text-error">*</span></label><input id="judge-last-name" autoComplete="family-name" value={draft.lastName} onChange={event => setField("lastName", event.target.value)} className={fieldInput} /></div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><label className={fieldLabel} htmlFor="judge-middle-name">Middle name</label><input id="judge-middle-name" autoComplete="additional-name" value={draft.middleName ?? ""} onChange={event => setField("middleName", event.target.value || null)} className={fieldInput} /></div>
                <div><label className={fieldLabel} htmlFor="judge-phone">Phone number</label><input id="judge-phone" type="tel" autoComplete="tel" value={draft.phone ?? ""} onChange={event => setField("phone", event.target.value || null)} className={fieldInput} /></div>
              </div>
              <div><label className={fieldLabel} htmlFor="judge-email">Email address</label><input id="judge-email" type="email" value={profileQuery.data.email} readOnly className={`${fieldInput} cursor-not-allowed bg-slate/50`} /><p className="mt-1 text-caption text-muted">Email is used to sign in and cannot be changed here.</p></div>
              <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
                <Button variant="secondary" size="sm" loading={updateProfile.isPending} disabled={saving} onClick={() => void saveProfile()}>Save profile</Button>
                <Button variant="ghost" size="sm" disabled={saving} onClick={() => { setDraft(toDraft(profileQuery.data!)); setFeedback(null); }}>Discard changes</Button>
                {uploadingPhoto ? <span className="text-caption text-muted">Uploading photo…</span> : null}
              </div>
            </Section>
            <DeleteAccountPanel />
          </>}
    </div>
  </div>;
}
