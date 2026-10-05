"use client";

import OrgPageShell from "@/src/features/org_owner/components/OrgPageShell";
import OrgBadge from "@/src/features/org_owner/components/OrgBadge";
import { Button } from "@/src/components/ui/Button";

// ── Placeholder data ──────────────────────────────────────────────────────────
const CURRENT_PLAN = {
  name: "Pro",
  status: "active" as const,
  price: "₱2,500 / month",
  renewsAt: "July 14, 2026",
  pageants: { used: 3, limit: 10 },
  teamMembers: { used: 18, limit: 50 },
  storage: { used: 2.4, limit: 20, unit: "GB" },
};

const PAYMENT_HISTORY = [
  {
    id: "1",
    date: "Jun 14, 2026",
    amount: "₱2,500",
    plan: "Pro",
    status: "paid",
    ref: "PAY-20260614",
  },
  {
    id: "2",
    date: "May 14, 2026",
    amount: "₱2,500",
    plan: "Pro",
    status: "paid",
    ref: "PAY-20260514",
  },
  {
    id: "3",
    date: "Apr 14, 2026",
    amount: "₱2,500",
    plan: "Pro",
    status: "paid",
    ref: "PAY-20260414",
  },
  {
    id: "4",
    date: "Mar 14, 2026",
    amount: "₱1,200",
    plan: "Basic",
    status: "paid",
    ref: "PAY-20260314",
  },
];

const PLANS = [
  {
    id: "basic",
    name: "Basic",
    price: "₱1,200",
    period: "/ month",
    features: [
      "Up to 3 pageants",
      "15 team members",
      "5 GB storage",
      "Email support",
    ],
    current: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "₱2,500",
    period: "/ month",
    features: [
      "Up to 10 pageants",
      "50 team members",
      "20 GB storage",
      "Priority support",
      "Advanced analytics",
    ],
    current: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    period: "",
    features: [
      "Unlimited pageants",
      "Unlimited team members",
      "Unlimited storage",
      "Dedicated support",
      "Custom branding",
      "SLA guarantee",
    ],
    current: false,
  },
];

// ── Usage bar ─────────────────────────────────────────────────────────────────
function UsageBar({
  used,
  limit,
  label,
  unit = "",
}: {
  used: number;
  limit: number;
  label: string;
  unit?: string;
}) {
  const pct = Math.min((used / limit) * 100, 100);
  const isHigh = pct >= 80;

  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <p className="text-caption text-muted">{label}</p>

        <p className="text-caption font-semibold text-charcoal">
          {used}
          {unit}{" "}
          <span className="font-normal text-muted">
            / {limit}
            {unit}
          </span>
        </p>
      </div>

      <div className="h-1.5 bg-border overflow-hidden">
        <div
          className={`h-full transition-all ${
            isHigh ? "bg-error" : "bg-navy"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function OrgOwnerBillingPage() {
  return (
    <OrgPageShell
      title="Billing"
      subtitle="Manage your subscription plan and view payment history."
      breadcrumbs={[
        { label: "Dashboard", href: "/org_owner/dashboard" },
        { label: "Billing" },
      ]}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: current plan + usage */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current plan card */}
          <div className="bg-surface border border-border overflow-hidden">
            <div className="bg-navy px-6 py-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-caption font-semibold uppercase tracking-[0.12em] text-gold/70 mb-0.5">
                  Current Plan
                </p>

                <p className="font-serif font-bold text-white text-h2">
                  {CURRENT_PLAN.name}
                </p>
              </div>

              <OrgBadge variant="success">Active</OrgBadge>
            </div>

            <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-border">
              <div>
                <p className="text-caption text-muted mb-0.5">Price</p>
                <p className="text-small font-semibold text-charcoal">
                  {CURRENT_PLAN.price}
                </p>
              </div>

              <div>
                <p className="text-caption text-muted mb-0.5">
                  Next renewal
                </p>
                <p className="text-small font-semibold text-charcoal">
                  {CURRENT_PLAN.renewsAt}
                </p>
              </div>

              <div>
                <p className="text-caption text-muted mb-0.5">
                  Billing cycle
                </p>
                <p className="text-small font-semibold text-charcoal">
                  Monthly
                </p>
              </div>
            </div>

            {/* Usage */}
            <div className="px-6 py-5 space-y-4">
              <p className="text-caption font-semibold uppercase tracking-[0.12em] text-muted">
                Usage
              </p>

              <UsageBar
                label="Pageants"
                used={CURRENT_PLAN.pageants.used}
                limit={CURRENT_PLAN.pageants.limit}
              />

              <UsageBar
                label="Team Members"
                used={CURRENT_PLAN.teamMembers.used}
                limit={CURRENT_PLAN.teamMembers.limit}
              />

              <UsageBar
                label="Storage"
                used={CURRENT_PLAN.storage.used}
                limit={CURRENT_PLAN.storage.limit}
                unit={` ${CURRENT_PLAN.storage.unit}`}
              />
            </div>

            <div className="px-6 pb-5 flex gap-3">
              <Button variant="secondary" size="sm">
                Upgrade Plan
              </Button>

              <Button variant="ghost" size="sm">
                Cancel Subscription
              </Button>
            </div>
          </div>

          {/* Payment history */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif font-bold text-charcoal text-h3">
                Payment History
              </h3>

              <Button variant="ghost" size="sm">
                Download all
              </Button>
            </div>

            <div className="border border-border bg-surface overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-navy/3">
                    <th className="px-4 py-3 text-caption font-semibold uppercase tracking-[0.1em] text-muted">
                      Date
                    </th>

                    <th className="px-4 py-3 text-caption font-semibold uppercase tracking-[0.1em] text-muted">
                      Plan
                    </th>

                    <th className="px-4 py-3 text-caption font-semibold uppercase tracking-[0.1em] text-muted">
                      Amount
                    </th>

                    <th className="px-4 py-3 text-caption font-semibold uppercase tracking-[0.1em] text-muted hidden sm:table-cell">
                      Reference
                    </th>

                    <th className="px-4 py-3 text-caption font-semibold uppercase tracking-[0.1em] text-muted">
                      Status
                    </th>

                    <th className="px-4 py-3" />
                  </tr>
                </thead>

                <tbody>
                  {PAYMENT_HISTORY.map((payment) => (
                    <tr
                      key={payment.id}
                      className="border-b border-border/60 last:border-b-0 hover:bg-slate/30 transition-colors"
                    >
                      <td className="px-4 py-3 text-small text-charcoal">
                        {payment.date}
                      </td>

                      <td className="px-4 py-3 text-small text-charcoal">
                        {payment.plan}
                      </td>

                      <td className="px-4 py-3 text-small font-semibold text-charcoal tabular-nums">
                        {payment.amount}
                      </td>

                      <td className="px-4 py-3 text-caption text-muted font-mono hidden sm:table-cell">
                        {payment.ref}
                      </td>

                      <td className="px-4 py-3">
                        <OrgBadge variant="success">Paid</OrgBadge>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          className="text-caption text-muted hover:text-navy transition-colors"
                        >
                          Receipt
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right column: plan cards */}
        <div className="space-y-4">
          <h3 className="font-serif font-bold text-charcoal text-h3">
            Available Plans
          </h3>

          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`border bg-surface overflow-hidden ${
                plan.current ? "border-gold" : "border-border"
              }`}
            >
              {plan.current && (
                <div className="bg-gold px-4 py-1.5 text-center">
                  <p className="text-caption font-bold uppercase tracking-[0.1em] text-navy">
                    Current Plan
                  </p>
                </div>
              )}

              <div className="px-5 py-4">
                <p className="font-serif font-bold text-charcoal text-h3">
                  {plan.name}
                </p>

                <p className="text-[1.5rem] font-bold text-navy mt-1">
                  {plan.price}

                  {plan.period && (
                    <span className="text-small font-normal text-muted">
                      {plan.period}
                    </span>
                  )}
                </p>

                <ul className="mt-4 space-y-2">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-small text-muted"
                    >
                      <svg
                        className="w-4 h-4 text-success mt-0.5 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2.5}
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 12.75l6 6 9-13.5"
                        />
                      </svg>

                      {feature}
                    </li>
                  ))}
                </ul>

                <div className="mt-4">
                  {plan.current ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      fullWidth
                      disabled
                    >
                      Current Plan
                    </Button>
                  ) : plan.id === "enterprise" ? (
                    <Button variant="ghost" size="sm" fullWidth>
                      Contact Sales
                    </Button>
                  ) : (
                    <Button variant="secondary" size="sm" fullWidth>
                      Switch to {plan.name}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </OrgPageShell>
  );
}