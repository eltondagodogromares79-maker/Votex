"use client";

import OrgPageShell from "@/src/features/org_owner/components/OrgPageShell";
import OrgBadge from "@/src/features/org_owner/components/OrgBadge";
import { Button } from "@/src/components/ui/Button";

const PLAN = {
  name: "Pro",
  status: "active" as const,
  price: "₱2,500",
  interval: "month",
  renewsAt: "July 14, 2026",
  startedAt: "January 14, 2026",
  pageants:     { used: 3,   limit: 10 },
  teamMembers:  { used: 18,  limit: 50 },
  storage:      { used: 2.4, limit: 20, unit: "GB" },
};

function UsageBar({ label, used, limit, unit = "" }: { label: string; used: number; limit: number; unit?: string }) {
  const pct = Math.min((used / limit) * 100, 100);
  const isHigh = pct >= 80;
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <p className="text-small text-charcoal font-medium">{label}</p>
        <p className="text-caption font-semibold text-charcoal tabular-nums">
          {used}{unit} <span className="font-normal text-muted">/ {limit}{unit}</span>
        </p>
      </div>
      <div className="h-2 bg-border overflow-hidden">
        <div className={`h-full transition-all ${isHigh ? "bg-error" : "bg-navy"}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-caption text-muted mt-1">{Math.round(pct)}% used</p>
    </div>
  );
}

export default function SubscriptionPage() {
  return (
    <OrgPageShell
      title="My Subscription"
      subtitle="View and manage your current subscription plan."
      breadcrumbs={[
        { label: "Dashboard", href: "/org_owner/dashboard" },
        { label: "Billing", href: "/org_owner/billing" },
        { label: "My Subscription" },
      ]}
    >
      <div className="max-w-full space-y-6">

        {/* Current plan hero */}
        <div className="bg-navy overflow-hidden">
          <div className="px-6 py-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-gold/70 mb-1">Current Plan</p>
              <p className="font-serif font-bold text-white text-[2rem] leading-none">{PLAN.name}</p>
              <p className="text-white/50 text-small mt-2">
                {PLAN.price} / {PLAN.interval} · Renews {PLAN.renewsAt}
              </p>
            </div>
            <OrgBadge variant="success">Active</OrgBadge>
          </div>
          <div className="px-6 pb-5 border-t border-white/10 pt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: "Started",      value: PLAN.startedAt },
              { label: "Next Renewal", value: PLAN.renewsAt },
              { label: "Billing",      value: "Monthly" },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-caption text-white/40 mb-0.5">{item.label}</p>
                <p className="text-small font-semibold text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Usage */}
        <div className="bg-surface border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <p className="font-serif font-semibold text-charcoal text-h3">Plan Usage</p>
            <p className="text-small text-muted mt-0.5">Current usage across all features included in your plan.</p>
          </div>
          <div className="px-6 py-5 space-y-5">
            <UsageBar label="Pageants" used={PLAN.pageants.used} limit={PLAN.pageants.limit} />
            <UsageBar label="Team Members" used={PLAN.teamMembers.used} limit={PLAN.teamMembers.limit} />
            <UsageBar label="Storage" used={PLAN.storage.used} limit={PLAN.storage.limit} unit={` ${PLAN.storage.unit}`} />
          </div>
        </div>

        {/* Actions */}
        <div className="bg-surface border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <p className="font-serif font-semibold text-charcoal text-h3">Plan Management</p>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div className="flex items-center justify-between gap-4 py-3 border-b border-border/60">
              <div>
                <p className="text-small font-medium text-charcoal">Upgrade Plan</p>
                <p className="text-caption text-muted">Get more pageants, team members, and storage.</p>
              </div>
              <Button variant="secondary" size="sm">Upgrade</Button>
            </div>
            <div className="flex items-center justify-between gap-4 py-3 border-b border-border/60">
              <div>
                <p className="text-small font-medium text-charcoal">Change Billing Cycle</p>
                <p className="text-caption text-muted">Switch to annual billing and save up to 20%.</p>
              </div>
              <Button variant="ghost" size="sm">Switch to Annual</Button>
            </div>
            <div className="flex items-center justify-between gap-4 py-3">
              <div>
                <p className="text-small font-medium text-error">Cancel Subscription</p>
                <p className="text-caption text-muted">Your plan remains active until the end of the billing period.</p>
              </div>
              <Button variant="danger" size="sm">Cancel</Button>
            </div>
          </div>
        </div>

      </div>
    </OrgPageShell>
  );
}
