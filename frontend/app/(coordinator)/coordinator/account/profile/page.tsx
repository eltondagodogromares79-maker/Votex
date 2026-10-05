"use client";

import { useState } from "react";
import CoordinatorPageShell from "@/src/features/coordinator/components/CoordinatorPageShell";
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

export default function ProfilePage() {
  const [avatar, setAvatar] = useState<string | null>(null);

  return (
    <CoordinatorPageShell
      title="Profile"
      subtitle="Manage your coordinator profile and preferences."
      breadcrumbs={[
        { label: "Dashboard", href: "/coordinator/dashboard" },
        { label: "Profile" },
      ]}
    >
      <div className="max-w-3xl space-y-6">

        {/* Profile photo */}
        <Section title="Profile Photo" description="Your photo appears in pageant teams and activity feeds.">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-navy flex items-center justify-center shrink-0">
              {avatar ? (
                <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="font-serif font-bold text-gold text-[1.5rem]">C</span>
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
                <input type="text" defaultValue="Maria" className={fieldInput} />
              </div>
              <div>
                <label className={fieldLabel}>Last Name <span className="text-error">*</span></label>
                <input type="text" defaultValue="Santos" className={fieldInput} />
              </div>
            </div>
            <div>
              <label className={fieldLabel}>Display Name</label>
              <input type="text" defaultValue="Maria Santos" className={fieldInput} />
              <p className={fieldHint}>How your name appears to judges, tabulators, and org owners.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={fieldLabel}>Email Address <span className="text-error">*</span></label>
                <input type="email" defaultValue="maria@example.com" className={fieldInput} />
              </div>
              <div>
                <label className={fieldLabel}>Phone Number</label>
                <input type="tel" defaultValue="+63 917 234 5678" className={fieldInput} />
              </div>
            </div>
            <div className="pt-1 flex gap-3">
              <Button variant="secondary" size="sm">Save Changes</Button>
              <Button variant="ghost" size="sm">Discard</Button>
            </div>
          </div>
        </Section>

        {/* Coordinator preferences */}
        <Section title="Coordinator Preferences" description="Configure your pageant management settings.">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={fieldLabel}>Default Timezone</label>
                <select className={fieldInput + " bg-surface"}>
                  <option>Asia/Manila (GMT+8)</option>
                  <option>Asia/Singapore (GMT+8)</option>
                  <option>UTC</option>
                </select>
              </div>
              <div>
                <label className={fieldLabel}>Date Format</label>
                <select className={fieldInput + " bg-surface"}>
                  <option>MM/DD/YYYY</option>
                  <option>DD/MM/YYYY</option>
                  <option>YYYY-MM-DD</option>
                </select>
              </div>
            </div>
            <div>
              <label className={fieldLabel}>Bio</label>
              <textarea rows={3} placeholder="Brief description about your pageant coordination experience…"
                className="w-full px-3 py-2.5 bg-surface border border-border text-small text-charcoal placeholder:text-muted focus:outline-none focus:border-navy transition-colors resize-none" />
              <p className={fieldHint}>Visible to org owners when they assign pageants to you.</p>
            </div>
            <Button variant="secondary" size="sm">Update Preferences</Button>
          </div>
        </Section>

        {/* Notification preferences */}
        <Section title="Notifications" description="Choose which events trigger email notifications.">
          <div className="space-y-3">
            {[
              { label: "New pageant assigned",      desc: "When an org owner assigns a new pageant to you",       checked: true  },
              { label: "Judge score submission",    desc: "When judges submit scores in your pageants",           checked: true  },
              { label: "Round completion",          desc: "When a scoring round is completed",                     checked: true  },
              { label: "Candidate status changes", desc: "When candidates are added, removed, or updated",        checked: false },
              { label: "System announcements",     desc: "Platform updates and maintenance notifications",        checked: true  },
            ].map((item) => (
              <div key={item.label} className="flex items-start justify-between gap-4 py-3 border-b border-border/60 last:border-b-0">
                <div>
                  <p className="text-small font-medium text-charcoal">{item.label}</p>
                  <p className="text-caption text-muted mt-0.5">{item.desc}</p>
                </div>
                <input type="checkbox" defaultChecked={item.checked} 
                  className="w-4 h-4 text-navy bg-surface border-border rounded focus:ring-navy focus:ring-2" />
              </div>
            ))}
          </div>
          <div className="pt-3">
            <Button variant="secondary" size="sm">Save Notifications</Button>
          </div>
        </Section>

      </div>
    </CoordinatorPageShell>
  );
}