"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import OrgPageShell from "@/src/features/org_owner/components/OrgPageShell";
import OrgBadge from "@/src/features/org_owner/components/OrgBadge";
import { Button } from "@/src/components/ui/Button";
import { useSession } from "@/src/features/auth/context/SessionContext";
import { authApi } from "@/src/features/auth/api/authentication";
import { ApiError } from "@/src/lib/api/client";
import { useToast } from "@/src/components/ui/Toast";
import {
  useOrganizationProfile,
  useUpdateOrganizationProfile,
} from "@/src/features/org_owner/hooks/useOrganizationProfile";
import type { MeResponse } from "@/src/features/auth/api/authentication";
import type { OrganizationProfile } from "@/src/types";
import { CloudinaryImageUpload } from "@/src/components/ui/CloudinaryImageUpload";
import DeleteAccountPanel from "@/src/features/auth/components/DeleteAccountPanel";

const fieldLabel = "block text-small font-medium text-charcoal mb-1.5";
const fieldInput  = "w-full h-10 px-3 bg-surface border border-border text-small text-charcoal placeholder:text-muted focus:outline-none focus:border-navy transition-colors";
const fieldHint   = "text-caption text-muted mt-1";

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface border border-border overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <h3 className="font-serif font-semibold text-charcoal text-h3">{title}</h3>
        {description && <p className="text-small text-muted mt-0.5 leading-relaxed">{description}</p>}
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

export default function AccountsSettingsPage() {
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [emailDraft, setEmailDraft] = useState("");
  const { currentUser, setCurrentUser } = useSession();
  const { toast } = useToast();
  const orgId = currentUser?.organizationId ?? "";
  const profileQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: authApi.me,
    enabled: !!currentUser,
  });
  const organizationQuery = useOrganizationProfile(orgId);
  const updateProfile = useMutation({
    mutationFn: authApi.updateMe,
    onSuccess: (profile) => {
      profileQuery.refetch();
      setCurrentUser({
        ...currentUser!,
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        pendingEmail: profile.pendingEmail,
        emailVerifiedAt: profile.emailVerifiedAt,
        profileImageUrl: profile.profileImageUrl,
      });
    },
  });
  const updateOrganization = useUpdateOrganizationProfile(orgId);
  const [personal, setPersonal] = useState<MeResponse | null>(null);
  const [organization, setOrganization] = useState<OrganizationProfile | null>(null);

  useEffect(() => {
    if (profileQuery.data) {
      setPersonal(profileQuery.data);
      setEmailDraft(profileQuery.data.pendingEmail ?? profileQuery.data.email);
    }
  }, [profileQuery.data]);

  useEffect(() => {
    if (organizationQuery.data) setOrganization(organizationQuery.data);
  }, [organizationQuery.data]);

  async function savePersonalInfo() {
    if (!personal) return;
    try {
      const saved = await updateProfile.mutateAsync({
        firstName: personal.firstName,
        middleName: personal.middleName,
        lastName: personal.lastName,
        phone: personal.phone,
        profileImageUrl: personal.profileImageUrl,
      });
      setPersonal(saved);
      toast.success("Personal information updated.");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.userMessage : "Could not update personal information.");
    }
  }

  async function saveOrganizationInfo() {
    if (!organization) return;
    try {
      const saved = await updateOrganization.mutateAsync({
        name: organization.name,
        slug: organization.slug,
        description: organization.description,
        email: organization.email,
        phone: organization.phone,
        address: organization.address,
        logoUrl: organization.logoUrl,
      });
      setOrganization(saved);
      toast.success("Organization profile updated.");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.userMessage : "Could not update the organization profile.");
    }
  }

  function updatePersonal<K extends keyof MeResponse>(key: K, value: MeResponse[K]) {
    setPersonal((valueBefore) => valueBefore ? { ...valueBefore, [key]: value } : valueBefore);
  }

  function updateOrganizationField<K extends keyof OrganizationProfile>(key: K, value: OrganizationProfile[K]) {
    setOrganization((valueBefore) => valueBefore ? { ...valueBefore, [key]: value } : valueBefore);
  }


  async function sendVerificationCode() {
    setSendingCode(true);
    try {
      await authApi.sendVerificationCode();
      setCodeSent(true);
      toast.success(`Verification code sent to ${personal?.pendingEmail ?? currentUser?.email}.`);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.userMessage : "Could not send the verification code.");
    } finally {
      setSendingCode(false);
    }
  }

  async function verifyEmail() {
    const targetEmail = personal?.pendingEmail ?? currentUser?.email;
    if (!targetEmail) return;
    setVerifyingCode(true);
    try {
      await authApi.verifyEmail({ email: targetEmail, code: code.trim() });
      const refreshedProfile = await authApi.me();
      setPersonal(refreshedProfile);
      setEmailDraft(refreshedProfile.email);
      if (currentUser) {
        setCurrentUser({
          ...currentUser,
          email: refreshedProfile.email,
          pendingEmail: refreshedProfile.pendingEmail,
          emailVerifiedAt: refreshedProfile.emailVerifiedAt,
        });
      }
      setCodeSent(false);
      setCode("");
      toast.success("Your email has been verified.");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.userMessage : "Could not verify the code.");
    } finally {
      setVerifyingCode(false);
    }
  }

  async function requestEmailChange() {
    setSavingEmail(true);
    try {
      const updated = await authApi.requestEmailChange(emailDraft.trim());
      setPersonal(updated);
      if (currentUser) setCurrentUser({ ...currentUser, pendingEmail: updated.pendingEmail });
      if (updated.pendingEmail || !updated.emailVerifiedAt) {
        await authApi.sendVerificationCode();
        setCodeSent(true);
        setCode("");
        toast.success(`Verification code sent to ${updated.pendingEmail ?? updated.email}.`);
      } else {
        setCodeSent(false);
        toast.info("That is already your verified email address.");
      }
    } catch (error) {
      toast.error(error instanceof ApiError ? error.userMessage : "Could not request the email change.");
    } finally {
      setSavingEmail(false);
    }
  }

  return (
    <OrgPageShell
      title="Account Settings"
      subtitle="Manage your personal account details and organization profile."
      breadcrumbs={[
        { label: "Dashboard", href: "/org_owner/dashboard" },
        { label: "Settings",  href: "/org_owner/settings" },
        { label: "Accounts" },
      ]}
    >
      <div className="max-w-full space-y-6">

        <div id="email-verification">
          <Section
            title="Email Verification"
            description={`Verify ${personal?.pendingEmail ?? currentUser?.email ?? "your email address"} to secure your account and subscribe to plans.`}
          >
            {currentUser?.emailVerifiedAt && !currentUser.pendingEmail ? (
              <OrgBadge variant="success">Email verified</OrgBadge>
            ) : (
              <div className="space-y-4">
                <p className="text-small text-charcoal">
                  {codeSent
                    ? "Enter the 6-digit code sent to your email address. The code expires after a short time."
                    : "We’ll email you a 6-digit code to confirm that you own this address."}
                </p>
                {codeSent && (
                  <div className="max-w-sm">
                    <label htmlFor="verification-code" className={fieldLabel}>Verification code</label>
                    <input
                      id="verification-code"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      pattern="[0-9]{6}"
                      value={code}
                      onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="Enter 6-digit code"
                      className={fieldInput}
                    />
                  </div>
                )}
                <div className="flex flex-wrap gap-3">
                  {!codeSent ? (
                    <Button variant="secondary" size="sm" loading={sendingCode} onClick={() => void sendVerificationCode()}>
                      Send verification code
                    </Button>
                  ) : (
                    <>
                      <Button variant="secondary" size="sm" loading={verifyingCode} disabled={code.length !== 6} onClick={() => void verifyEmail()}>
                        Verify email
                      </Button>
                      <Button variant="ghost" size="sm" loading={sendingCode} onClick={() => void sendVerificationCode()}>
                        Resend code
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}
          </Section>
        </div>

        {/* Personal info */}
        <Section title="Personal Information" description="Update your name and contact details.">
          {profileQuery.isError ? (
            <p className="text-small text-error">Could not load your account details. Refresh and try again.</p>
          ) : profileQuery.isLoading || !personal ? (
            <p className="text-small text-muted">Loading your account details…</p>
          ) : <div className="space-y-4">
            <div>
              <label className={fieldLabel}>Profile photo</label>
              <CloudinaryImageUpload folder="profile-images" rounded value={personal.profileImageUrl} label="Upload profile photo" onChange={(url) => updatePersonal("profileImageUrl", url || null)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={fieldLabel}>First Name <span className="text-error">*</span></label>
                <input type="text" value={personal.firstName} onChange={(event) => updatePersonal("firstName", event.target.value)} className={fieldInput} />
              </div>
              <div>
                <label className={fieldLabel}>Last Name <span className="text-error">*</span></label>
                <input type="text" value={personal.lastName} onChange={(event) => updatePersonal("lastName", event.target.value)} className={fieldInput} />
              </div>
            </div>
            <div>
              <label className={fieldLabel}>Middle Name</label>
              <input type="text" value={personal.middleName ?? ""} onChange={(event) => updatePersonal("middleName", event.target.value || null)} className={fieldInput} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={fieldLabel}>Email Address <span className="text-error">*</span></label>
                <input
                  type="email"
                  value={personal.emailVerifiedAt ? personal.email : emailDraft}
                  disabled={!!personal.emailVerifiedAt}
                  onChange={(event) => setEmailDraft(event.target.value)}
                  className={`${fieldInput} ${personal.emailVerifiedAt ? "opacity-70" : ""}`}
                />
                <p className={fieldHint}>
                  {personal.emailVerifiedAt
                    ? "Verified email addresses cannot be changed."
                    : personal.pendingEmail
                      ? `Waiting for verification of ${personal.pendingEmail}.`
                      : "You can edit this address until it is verified."}
                </p>
              </div>
              <div>
                <label className={fieldLabel}>Phone Number</label>
                <input type="tel" value={personal.phone ?? ""} onChange={(event) => updatePersonal("phone", event.target.value || null)} className={fieldInput} />
              </div>
            </div>
            <div className="pt-1 flex gap-3">
              <Button variant="secondary" size="sm" loading={updateProfile.isPending} onClick={() => void savePersonalInfo()}>Save Changes</Button>
              <Button variant="ghost" size="sm" onClick={() => profileQuery.data && setPersonal(profileQuery.data)}>Discard</Button>
            </div>
            {!personal.emailVerifiedAt && (
              <Button
                variant="secondary"
                size="sm"
                loading={savingEmail}
                disabled={!emailDraft.trim() || emailDraft.trim() === personal.email}
                onClick={() => void requestEmailChange()}
              >
                {personal.pendingEmail ? "Send code to new email" : "Update email"}
              </Button>
            )}
          </div>}
        </Section>

        {/* Organization profile */}
        <Section title="Organization Profile" description="Public-facing details for your pageant organization.">
          {organizationQuery.isError ? (
            <p className="text-small text-error">Could not load organization details. Refresh and try again.</p>
          ) : organizationQuery.isLoading || !organization ? (
            <p className="text-small text-muted">Loading organization details…</p>
          ) : <div className="space-y-4">
            <div>
              <label className={fieldLabel}>Organization logo</label>
              <CloudinaryImageUpload folder="organization-logos" value={organization.logoUrl} label="Upload organization logo" onChange={(url) => updateOrganizationField("logoUrl", url || null)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={fieldLabel}>Organization Name <span className="text-error">*</span></label>
                <input type="text" value={organization.name} onChange={(event) => updateOrganizationField("name", event.target.value)} className={fieldInput} />
              </div>
              <div>
                <label className={fieldLabel}>URL Slug <span className="text-error">*</span></label>
                <input type="text" value={organization.slug} onChange={(event) => updateOrganizationField("slug", event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} className={fieldInput} />
                <p className={fieldHint}>Public URL slug for the organization.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={fieldLabel}>Organization Email</label>
                <input type="email" value={organization.email ?? ""} onChange={(event) => updateOrganizationField("email", event.target.value || null)} className={fieldInput} />
              </div>
              <div>
                <label className={fieldLabel}>Organization Phone</label>
                <input type="tel" value={organization.phone ?? ""} onChange={(event) => updateOrganizationField("phone", event.target.value || null)} className={fieldInput} />
              </div>
            </div>
            <div>
              <label className={fieldLabel}>Description</label>
              <textarea rows={3} value={organization.description ?? ""} onChange={(event) => updateOrganizationField("description", event.target.value || null)}
                className="w-full px-3 py-2.5 bg-surface border border-border text-small text-charcoal placeholder:text-muted focus:outline-none focus:border-navy transition-colors resize-none" />
            </div>
            <div>
              <label className={fieldLabel}>Address</label>
              <textarea rows={2} value={organization.address ?? ""} onChange={(event) => updateOrganizationField("address", event.target.value || null)}
                className="w-full px-3 py-2.5 bg-surface border border-border text-small text-charcoal placeholder:text-muted focus:outline-none focus:border-navy transition-colors resize-none" />
            </div>
            <Button variant="secondary" size="sm" loading={updateOrganization.isPending} onClick={() => void saveOrganizationInfo()}>Update Organization</Button>
          </div>}
        </Section>

        {/* Password */}
        <Section title="Change Password">
          <div className="space-y-4">
            <div>
              <label className={fieldLabel}>Current Password</label>
              <input type="password" placeholder="Enter your current password" className={fieldInput} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={fieldLabel}>New Password</label>
                <input type="password" placeholder="Minimum 8 characters" className={fieldInput} />
              </div>
              <div>
                <label className={fieldLabel}>Confirm New Password</label>
                <input type="password" placeholder="Re-enter new password" className={fieldInput} />
              </div>
            </div>
            <Button variant="secondary" size="sm">Change Password</Button>
          </div>
        </Section>

        <DeleteAccountPanel />

      </div>
    </OrgPageShell>
  );
}
