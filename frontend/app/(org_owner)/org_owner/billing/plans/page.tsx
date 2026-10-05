"use client";

import { useState } from "react";
import OrgPageShell from "@/src/features/org_owner/components/OrgPageShell";
import { Button } from "@/src/components/ui/Button";

const BILLING_CYCLES = ["monthly", "annual"] as const;
type BillingCycle = (typeof BILLING_CYCLES)[number];

const PLANS = [
  {
    id: "basic",
    name: "Basic",
    monthlyPrice: 1200,
    annualPrice: 960,
    current: false,
    features: [
      { label: "Up to 3 pageants", included: true },
      { label: "15 team members", included: true },
      { label: "5 GB storage", included: true },
      { label: "Email support", included: true },
      { label: "Audience voting", included: false },
      { label: "Advanced analytics", included: false },
      { label: "Priority support", included: false },
      { label: "Custom branding", included: false },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    monthlyPrice: 2500,
    annualPrice: 2000,
    current: true,
    features: [
      { label: "Up to 10 pageants", included: true },
      { label: "50 team members", included: true },
      { label: "20 GB storage", included: true },
      { label: "Email support", included: true },
      { label: "Audience voting", included: true },
      { label: "Advanced analytics", included: true },
      { label: "Priority support", included: false },
      { label: "Custom branding", included: false },
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    monthlyPrice: 0,
    annualPrice: 0,
    current: false,
    features: [
      { label: "Unlimited pageants", included: true },
      { label: "Unlimited team members", included: true },
      { label: "Unlimited storage", included: true },
      { label: "Email support", included: true },
      { label: "Audience voting", included: true },
      { label: "Advanced analytics", included: true },
      { label: "Priority support", included: true },
      { label: "Custom branding", included: true },
    ],
  },
];

function CheckIcon({ checked }: { checked: boolean }) {
  if (checked) {
    return (
      <svg
        className="w-4 h-4 text-success shrink-0"
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
    );
  }

  return (
    <svg
      className="w-4 h-4 text-border shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

export default function PlansPage() {
  const [cycle, setCycle] = useState<BillingCycle>("monthly");

  return (
    <OrgPageShell
      title="Plans & Pricing"
      subtitle="Choose the plan that best fits your organization's needs."
      breadcrumbs={[
        { label: "Dashboard", href: "/org_owner/dashboard" },
        { label: "Billing", href: "/org_owner/billing" },
        { label: "Plans & Pricing" },
      ]}
    >
      <div className="space-y-8">
        {/* Billing cycle toggle */}
        <div className="flex items-center gap-3">
          <div className="inline-flex border border-border bg-surface overflow-hidden rounded-md">
            {BILLING_CYCLES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCycle(c)}
                className={`h-9 px-5 text-small font-medium transition-colors capitalize
                  ${
                    cycle === c
                      ? "bg-navy text-white"
                      : "text-muted hover:text-charcoal"
                  }`}
              >
                {c}
              </button>
            ))}
          </div>

          {cycle === "annual" && (
            <span className="text-caption font-semibold text-success bg-success/10 px-2.5 py-1 rounded">
              Save up to 20%
            </span>
          )}
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PLANS.map((plan) => {
            const price =
              cycle === "annual" ? plan.annualPrice : plan.monthlyPrice;
            const isEnterprise = plan.id === "enterprise";

            return (
              <div
                key={plan.id}
                className={`bg-surface overflow-hidden flex flex-col border rounded-lg
                  ${plan.current ? "border-gold shadow-sm" : "border-border"}`}
              >
                {/* Top band */}
                {plan.current ? (
                  <div className="bg-gold px-5 py-2 text-center">
                    <p className="text-caption font-bold uppercase tracking-[0.1em] text-navy">
                      Your Current Plan
                    </p>
                  </div>
                ) : (
                  <div
                    className={`h-1 ${
                      plan.id === "enterprise" ? "bg-navy" : "bg-border"
                    }`}
                  />
                )}

                <div className="px-5 py-5 flex flex-col flex-1">
                  {/* Name + price */}
                  <p className="font-serif font-bold text-charcoal text-h2 mb-1">
                    {plan.name}
                  </p>

                  {isEnterprise ? (
                    <p className="text-[1.5rem] font-bold text-navy leading-none mb-1">
                      Custom
                    </p>
                  ) : (
                    <p className="text-[1.75rem] font-bold text-navy leading-none mb-1 tabular-nums">
                      ₱{price.toLocaleString()}
                      <span className="text-small font-normal text-muted">
                        {" "}
                        / mo
                      </span>
                    </p>
                  )}

                  {cycle === "annual" && !isEnterprise && (
                    <p className="text-caption text-muted mb-3">
                      Billed annually · ₱{(price * 12).toLocaleString()} / yr
                    </p>
                  )}

                  {/* Features */}
                  <ul className="mt-4 space-y-2.5 flex-1">
                    {plan.features.map((f) => (
                      <li key={f.label} className="flex items-center gap-2.5">
                        <CheckIcon checked={f.included} />
                        <span
                          className={`text-small ${
                            f.included
                              ? "text-charcoal"
                              : "text-muted line-through"
                          }`}
                        >
                          {f.label}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <div className="mt-6">
                    {plan.current ? (
                      <Button variant="ghost" size="sm" fullWidth disabled>
                        Current Plan
                      </Button>
                    ) : isEnterprise ? (
                      <Button variant="primary" size="sm" fullWidth>
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
            );
          })}
        </div>

        {/* FAQ */}
        <div className="mt-6 max-w-2xl">
          <p className="font-serif font-bold text-charcoal text-h3 mb-4">
            Frequently Asked Questions
          </p>

          {[
            {
              q: "Can I change my plan at any time?",
              a: "Yes. Upgrades take effect immediately. Downgrades take effect at the end of your current billing period.",
            },
            {
              q: "What happens to my data if I cancel?",
              a: "Your data is retained for 30 days after cancellation. You can export all data at any time.",
            },
            {
              q: "Do you offer refunds?",
              a: "We offer a 7-day refund policy on new subscriptions. Renewals are non-refundable.",
            },
          ].map((item) => (
            <div
              key={item.q}
              className="border-b border-border py-4 last:border-b-0"
            >
              <p className="text-small font-semibold text-charcoal mb-1">
                {item.q}
              </p>
              <p className="text-small text-muted leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </OrgPageShell>
  );
}