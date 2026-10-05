"use client";

import { useState } from "react";
import OrgPageShell from "@/src/features/org_owner/components/OrgPageShell";
import OrgBadge from "@/src/features/org_owner/components/OrgBadge";
import { Button } from "@/src/components/ui/Button";

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
  const [avatar, setAvatar] = useState<string | null>(null);

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

        {/* Profile avatar */}
        <Section title="Profile Photo" description="This appears alongside your name in the platform.">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-navy flex items-center justify-center shrink-0">
              {avatar ? (
                <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="font-serif font-bold text-gold text-[1.5rem]">J</span>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" size="sm">Upload Photo</Button>
              {avatar && <Button variant="danger" size="sm" onClick={() => setAvatar(null)}>Remove</Button>}
            </div>
          </div>
        </Section>

        {/* Personal info */}
        <Section title="Personal Information" description="Update your name and contact details.">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={fieldLabel}>First Name <span className="text-error">*</span></label>
                <input type="text" defaultValue="Juan" className={fieldInput} />
              </div>
              <div>
                <label className={fieldLabel}>Last Name <span className="text-error">*</span></label>
                <input type="text" defaultValue="dela Cruz" className={fieldInput} />
              </div>
            </div>
            <div>
              <label className={fieldLabel}>Display Name</label>
              <input type="text" defaultValue="Juan dela Cruz" className={fieldInput} />
              <p className={fieldHint}>How your name appears to team members and across the platform.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={fieldLabel}>Email Address <span className="text-error">*</span></label>
                <div className="relative">
                  <input type="email" defaultValue="juan@example.com" className={fieldInput} />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <OrgBadge variant="success">Verified</OrgBadge>
                  </div>
                </div>
              </div>
              <div>
                <label className={fieldLabel}>Phone Number</label>
                <input type="tel" defaultValue="+63 917 123 4567" className={fieldInput} />
              </div>
            </div>
            <div className="pt-1 flex gap-3">
              <Button variant="secondary" size="sm">Save Changes</Button>
              <Button variant="ghost" size="sm">Discard</Button>
            </div>
          </div>
        </Section>

        {/* Organization profile */}
        <Section title="Organization Profile" description="Public-facing details for your pageant organization.">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={fieldLabel}>Organization Name <span className="text-error">*</span></label>
                <input type="text" defaultValue="Votex Demo Organization" className={fieldInput} />
              </div>
              <div>
                <label className={fieldLabel}>URL Slug <span className="text-error">*</span></label>
                <input type="text" defaultValue="votex-demo-org" className={fieldInput} />
                <p className={fieldHint}>votex.app/org/votex-demo-org</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={fieldLabel}>Country</label>
                <select className={fieldInput + " bg-surface"}>
                  <option>Philippines</option>
                  <option>Singapore</option>
                  <option>United States</option>
                </select>
              </div>
              <div>
                <label className={fieldLabel}>Timezone</label>
                <select className={fieldInput + " bg-surface"}>
                  <option>Asia/Manila (GMT+8)</option>
                  <option>Asia/Singapore (GMT+8)</option>
                  <option>UTC</option>
                </select>
              </div>
            </div>
            <div>
              <label className={fieldLabel}>Description</label>
              <textarea rows={3} placeholder="Brief description of your pageant organization…"
                className="w-full px-3 py-2.5 bg-surface border border-border text-small text-charcoal placeholder:text-muted focus:outline-none focus:border-navy transition-colors resize-none" />
            </div>
            <Button variant="secondary" size="sm">Update Organization</Button>
          </div>
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

        {/* Danger zone */}
        <div className="border border-error/30 bg-surface overflow-hidden">
          <div className="px-6 py-4 border-b border-error/30 bg-error/5">
            <h3 className="font-serif font-semibold text-error text-h3">Danger Zone</h3>
            <p className="text-small text-muted mt-0.5">These actions are permanent and cannot be undone.</p>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-small font-semibold text-charcoal">Deactivate Account</p>
                <p className="text-caption text-muted mt-0.5">Temporarily disable your account. You can reactivate at any time.</p>
              </div>
              <Button variant="ghost" size="sm">Deactivate</Button>
            </div>
            <div className="h-px bg-error/15" />
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-small font-semibold text-error">Delete Account</p>
                <p className="text-caption text-muted mt-0.5">Permanently delete your account and all associated data.</p>
              </div>
              <Button variant="danger" size="sm">Delete Account</Button>
            </div>
          </div>
        </div>

      </div>
    </OrgPageShell>
  );
}
