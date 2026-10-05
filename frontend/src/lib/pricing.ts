/**
 * Pricing configuration — single source of truth.
 * All pricing page content and billing logic reads from here.
 *
 * Plans:
 *   basic      — ₱449 per event (1 pageant)
 *   premium    — ₱999 / month (3 pageants)
 *   enterprise — Contact Votex team (custom)
 *
 * NOTE: The backend billing/service.rs currently has different hardcoded
 * prices (basic=999, premium=2999, enterprise=9999). The backend must be
 * updated to match these frontend values before payments go live.
 * See TODO_BACKEND.md for details.
 */

import { formatPeso } from "@/src/lib/utils";

export interface PricingPlan {
  id: "basic" | "premium" | "enterprise";
  name: string;
  /** null = contact sales (enterprise) */
  price: number | null;
  currency: "PHP";
  billing: "per-event" | "monthly" | "custom";
  tagline: string;
  description: string;
  pageantsLimit: number | null; // null = unlimited / negotiated
  features: string[];
  highlighted?: boolean;
  cta: string;
  ctaHref: string;
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "basic",
    name: "Basic",
    price: 449,
    currency: "PHP",
    billing: "per-event",
    tagline: "Pay as you go",
    description:
      "Perfect for a single event. Pay once, run your pageant, done.",
    pageantsLimit: 1,
    features: [
      "1 pageant / event",
      "Unlimited candidates",
      "Unlimited judges & tabulators",
      "Live scoring & tabulation",
      "Real-time leaderboard",
      "Code-based judge login",
    ],
    cta: "Get started",
    ctaHref: "/register",
  },
  {
    id: "premium",
    name: "Premium",
    price: 999,
    currency: "PHP",
    billing: "monthly",
    tagline: "Best value for coordinators",
    description:
      "Run up to 3 pageants per month. Ideal for coordinators with a regular events schedule.",
    pageantsLimit: 3,
    features: [
      "3 pageants per month",
      "Everything in Basic",
      "Priority support",
      "Multi-round management",
      "Advanced tabulation grid",
    ],
    highlighted: true,
    cta: "Get started",
    ctaHref: "/register",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: null, // contact sales
    currency: "PHP",
    billing: "custom",
    tagline: "Custom for your organization",
    description:
      "Large-scale or recurring events? Let's talk. Custom pageant limits, dedicated support, and tailored onboarding.",
    pageantsLimit: null,
    features: [
      "Unlimited pageants",
      "Everything in Premium",
      "Dedicated account manager",
      "Custom onboarding & training",
      "SLA guarantee",
      "Custom integrations",
    ],
    cta: "Contact us",
    ctaHref: "/contact",
  },
] as const;

/** Format a plan price for display — returns "Contact us" for enterprise */
export function formatPlanPrice(plan: PricingPlan): string {
  if (plan.price === null) return "Custom";
  return formatPeso(plan.price);
}

/** Billing period label */
export const BILLING_PERIOD_LABELS: Record<PricingPlan["billing"], string> = {
  "per-event": "per event",
  monthly: "/ month",
  custom: "",
};
