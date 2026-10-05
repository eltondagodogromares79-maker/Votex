"use client";

import { useState } from "react";
import OrgPageShell from "@/src/features/org_owner/components/OrgPageShell";
import OrgBadge from "@/src/features/org_owner/components/OrgBadge";
import { Button } from "@/src/components/ui/Button";

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

function Toggle({ checked, onChange, label, description }: {
  checked: boolean; onChange: (v: boolean) => void; label: string; description?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3.5 border-b border-border/60 last:border-b-0">
      <div>
        <p className="text-small font-medium text-charcoal">{label}</p>
        {description && <p className="text-caption text-muted mt-0.5">{description}</p>}
      </div>
      <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
        className={`relative shrink-0 w-10 h-5 transition-colors ${checked ? "bg-navy" : "bg-border"}`}>
        <span className={`absolute top-0.5 w-4 h-4 bg-white transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
      </button>
    </div>
  );
}

const ACTIVE_SESSIONS = [
  { id: "1", device: "Chrome on Windows",  location: "Manila, Philippines",  lastActive: "Now",           current: true  },
  { id: "2", device: "Safari on iPhone 15", location: "Quezon City, PH",     lastActive: "2 hours ago",   current: false },
  { id: "3", device: "Firefox on macOS",    location: "Makati, PH",          lastActive: "Yesterday",     current: false },
];

const LOGIN_HISTORY = [
  { id: "1", date: "Jun 14, 2026 · 9:14 AM",  device: "Chrome on Windows", location: "Manila, PH",      status: "success" },
  { id: "2", date: "Jun 13, 2026 · 7:02 PM",  device: "Safari on iPhone",  location: "Manila, PH",      status: "success" },
  { id: "3", date: "Jun 12, 2026 · 11:45 AM", device: "Unknown",            location: "Unknown",         status: "failed"  },
  { id: "4", date: "Jun 11, 2026 · 3:20 PM",  device: "Chrome on Windows", location: "Manila, PH",      status: "success" },
];

export default function SecuritySettingsPage() {
  const [twoFactor,     setTwoFactor]     = useState(false);
  const [loginAlerts,   setLoginAlerts]   = useState(true);
  const [suspiciousAlerts, setSuspiciousAlerts] = useState(true);

  return (
    <OrgPageShell
      title="Security"
      subtitle="Manage your account security, sessions, and login history."
      breadcrumbs={[
        { label: "Dashboard", href: "/org_owner/dashboard" },
        { label: "Settings",  href: "/org_owner/settings" },
        { label: "Security" },
      ]}
    >
      <div className="max-w-full space-y-6">

        {/* Security overview */}
        <div className="bg-navy p-5 flex items-start gap-4">
          <div className="w-10 h-10 bg-success/20 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-white text-small">Your account is secure</p>
            <p className="text-caption text-white/50 mt-0.5 leading-relaxed">
              No suspicious activity detected. Enable two-factor authentication for additional protection.
            </p>
          </div>
        </div>

        {/* 2FA */}
        <Section title="Two-Factor Authentication (2FA)"
          description="Add an extra layer of security. A verification code will be required every time you sign in.">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${twoFactor ? "bg-success" : "bg-border"}`} />
              <span className="text-small font-medium text-charcoal">
                2FA is currently <strong>{twoFactor ? "enabled" : "disabled"}</strong>
              </span>
            </div>
            <Button
              variant={twoFactor ? "ghost" : "secondary"}
              size="sm"
              onClick={() => setTwoFactor(!twoFactor)}
            >
              {twoFactor ? "Disable 2FA" : "Enable 2FA"}
            </Button>
          </div>
          {twoFactor && (
            <div className="bg-success/8 border border-success/20 px-4 py-3">
              <p className="text-small text-success font-medium">
                2FA is active — your account requires a code on every login.
              </p>
            </div>
          )}
          {!twoFactor && (
            <div className="bg-gold/8 border border-gold/20 px-4 py-3">
              <p className="text-small text-charcoal leading-relaxed">
                <strong>Recommended:</strong> Enabling 2FA significantly reduces the risk of unauthorized access to your account.
              </p>
            </div>
          )}
        </Section>

        {/* Notifications */}
        <Section title="Security Alerts" description="Get notified of important security events.">
          <Toggle checked={loginAlerts}        onChange={setLoginAlerts}        label="New device login alert"
            description="Email me when my account is accessed from a new device or location." />
          <Toggle checked={suspiciousAlerts}   onChange={setSuspiciousAlerts}   label="Suspicious activity alert"
            description="Email me when unusual or potentially unauthorized access is detected." />
        </Section>

        {/* Active sessions */}
        <Section title="Active Sessions" description="Devices currently signed into your account.">
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
                  <OrgBadge variant="success">Current</OrgBadge>
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
        <Section title="Login History" description="Recent sign-in activity on your account.">
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
                <OrgBadge variant={entry.status === "success" ? "success" : "error"}>
                  {entry.status === "success" ? "Success" : "Failed"}
                </OrgBadge>
              </div>
            ))}
          </div>
        </Section>

      </div>
    </OrgPageShell>
  );
}
