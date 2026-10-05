"use client";

import { useState } from "react";
import CoordinatorPageShell from "@/src/features/coordinator/components/CoordinatorPageShell";
import CoordinatorBadge from "@/src/features/coordinator/components/CoordinatorBadge";
import { Button } from "@/src/components/ui/Button";

const fieldLabel = "block text-small font-medium text-charcoal mb-1.5";
const fieldInput  = "w-full h-10 px-3 bg-surface border border-border text-small text-charcoal placeholder:text-muted focus:outline-none focus:border-navy transition-colors";

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

const ACTIVE_SESSIONS = [
  { id: "1", device: "Chrome on Windows",   location: "Manila, Philippines", lastActive: "Now",         current: true  },
  { id: "2", device: "Safari on iPhone 15", location: "Quezon City, PH",     lastActive: "3 hours ago", current: false },
];

const LOGIN_HISTORY = [
  { id: "1", date: "Jun 14, 2026 · 2:30 PM", device: "Chrome on Windows", location: "Manila, PH",   status: "success" },
  { id: "2", date: "Jun 13, 2026 · 8:45 AM", device: "Safari on iPhone",  location: "Manila, PH",   status: "success" },
  { id: "3", date: "Jun 12, 2026 · 6:20 PM", device: "Unknown",            location: "Unknown",      status: "failed"  },
];

export default function SecurityPage() {
  const [twoFactor, setTwoFactor] = useState(false);

  return (
    <CoordinatorPageShell
      title="Security"
      subtitle="Manage your account security and login activity."
      breadcrumbs={[
        { label: "Dashboard", href: "/coordinator/dashboard" },
        { label: "Security" },
      ]}
    >
      <div className="max-w-3xl space-y-6">

        {/* Security status */}
        <div className="bg-navy p-5 flex items-start gap-4">
          <div className="w-10 h-10 bg-success/20 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-white text-small">Your account is secure</p>
            <p className="text-caption text-white/50 mt-0.5 leading-relaxed">
              No suspicious activity detected. Enable 2FA for additional protection.
            </p>
          </div>
        </div>

        {/* Change password */}
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

        {/* 2FA */}
        <Section title="Two-Factor Authentication" description="Add an extra layer of security to your coordinator account.">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${twoFactor ? "bg-success" : "bg-border"}`} />
              <span className="text-small font-medium text-charcoal">
                2FA is currently <strong>{twoFactor ? "enabled" : "disabled"}</strong>
              </span>
            </div>
            <Button variant={twoFactor ? "ghost" : "secondary"} size="sm" onClick={() => setTwoFactor(!twoFactor)}>
              {twoFactor ? "Disable 2FA" : "Enable 2FA"}
            </Button>
          </div>
          {!twoFactor && (
            <div className="bg-gold/8 border border-gold/20 px-4 py-3">
              <p className="text-small text-charcoal leading-relaxed">
                <strong>Recommended:</strong> 2FA protects your coordinator account and the pageants you manage.
              </p>
            </div>
          )}
        </Section>

        {/* Active sessions */}
        <Section title="Active Sessions" description="Devices currently signed into your coordinator account.">
          <div className="space-y-1">
            {ACTIVE_SESSIONS.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-4 py-3 border-b border-border/60 last:border-b-0">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${s.current ? "bg-success animate-pulse" : "bg-border"}`} />
                  <div>
                    <p className="text-small font-medium text-charcoal">{s.device}</p>
                    <p className="text-caption text-muted">{s.location} · {s.lastActive}</p>
                  </div>
                </div>
                {s.current ? (
                  <CoordinatorBadge variant="success">Current</CoordinatorBadge>
                ) : (
                  <button type="button" className="text-caption text-error hover:underline font-medium transition-colors">
                    Revoke
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <Button variant="danger" size="sm">Revoke All Other Sessions</Button>
          </div>
        </Section>

        {/* Login history */}
        <Section title="Login History" description="Recent sign-in activity.">
          <div className="space-y-1">
            {LOGIN_HISTORY.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between gap-4 py-3 border-b border-border/60 last:border-b-0">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${entry.status === "success" ? "bg-success" : "bg-error"}`} />
                  <div>
                    <p className="text-small text-charcoal">{entry.device}</p>
                    <p className="text-caption text-muted">{entry.location} · {entry.date}</p>
                  </div>
                </div>
                <CoordinatorBadge variant={entry.status === "success" ? "success" : "error"}>
                  {entry.status === "success" ? "Success" : "Failed"}
                </CoordinatorBadge>
              </div>
            ))}
          </div>
        </Section>

      </div>
    </CoordinatorPageShell>
  );
}