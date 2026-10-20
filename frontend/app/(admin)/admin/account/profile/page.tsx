"use client";

import { useEffect, useState } from "react";
import AdminPageShell from "@/src/features/admin/components/AdminPageShell";
import { Button } from "@/src/components/ui/Button";
import { CloudinaryImageUpload } from "@/src/components/ui/CloudinaryImageUpload";
import { authApi, type MeResponse } from "@/src/features/auth/api/authentication";
import { ApiError } from "@/src/lib/api/client";
import { useToast } from "@/src/components/ui/Toast";
import DeleteAccountPanel from "@/src/features/auth/components/DeleteAccountPanel";

export default function AdminProfilePage() {
  const { toast } = useToast();
  const [profile, setProfile] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(false);
  useEffect(() => {
    authApi.me().then(setProfile).catch(() => setLoadError(true)).finally(() => setLoading(false));
  }, []);

  async function save() {
    if (!profile) return;
    setSaving(true);
    try {
      const updated = await authApi.updateMe({
        firstName: profile.firstName,
        middleName: profile.middleName,
        lastName: profile.lastName,
        phone: profile.phone,
        profileImageUrl: profile.profileImageUrl,
      });
      setProfile(updated);
      toast.success("Profile updated.");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.userMessage : "Could not update your profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminPageShell title="Profile" subtitle="Your administrator account details." breadcrumbs={[{ label: "Dashboard", href: "/admin/dashboard" }, { label: "Profile" }]}>
      <section className="max-w-3xl border border-border bg-surface p-6">
        <h2 className="font-serif text-h3 font-semibold text-charcoal">Account</h2>
        {loading ? <p className="mt-4 text-small text-muted">Loading profile…</p> : !profile || loadError ? <p className="mt-4 text-small text-error">Profile could not be loaded.</p> : (
          <div className="mt-5 space-y-5">
            <div>
              <label className="mb-1.5 block text-small font-medium text-charcoal">Profile photo</label>
              <CloudinaryImageUpload folder="profile-images" rounded value={profile.profileImageUrl} label="Upload profile photo" onChange={(url) => setProfile({ ...profile, profileImageUrl: url || null })} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-small font-medium text-charcoal">First name<input value={profile.firstName} onChange={(event) => setProfile({ ...profile, firstName: event.target.value })} className="mt-1.5 h-10 w-full border border-border bg-surface px-3 font-normal" /></label>
              <label className="text-small font-medium text-charcoal">Last name<input value={profile.lastName} onChange={(event) => setProfile({ ...profile, lastName: event.target.value })} className="mt-1.5 h-10 w-full border border-border bg-surface px-3 font-normal" /></label>
            </div>
            <label className="block text-small font-medium text-charcoal">Phone<input value={profile.phone ?? ""} onChange={(event) => setProfile({ ...profile, phone: event.target.value || null })} className="mt-1.5 h-10 w-full border border-border bg-surface px-3 font-normal" /></label>
            <p className="text-caption text-muted">{profile.email}</p>
            <Button variant="secondary" size="sm" loading={saving} onClick={() => void save()}>Save profile</Button>
          </div>
        )}
      </section>
      <div className="mt-6 max-w-3xl"><DeleteAccountPanel /></div>
    </AdminPageShell>
  );
}
