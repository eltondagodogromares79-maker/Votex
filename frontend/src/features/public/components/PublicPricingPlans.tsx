"use client";

import Link from "next/link";
import { Button } from "@/src/components/ui/Button";
import { useSession } from "@/src/features/auth/context/SessionContext";
import { usePublicPlans } from "@/src/features/public/hooks/usePublicCatalog";
import type { PublicSubscriptionPlan } from "@/src/features/public/api/publicCatalog";
import { PublicDashboardLink } from "./PublicDashboardLink";

function formatPrice(amount: number | string, currency: string) {
  const value = Number(amount);
  if (!Number.isFinite(value)) return `${currency} ${amount}`;
  return new Intl.NumberFormat("en-PH", { style: "currency", currency, maximumFractionDigits: 2 }).format(value);
}

function featureLimit(label: string, limit: number | null) {
  return limit == null ? `Unlimited ${label}` : `Up to ${limit} ${label}`;
}

export function PublicPricingPlans({ initialPlans }: { initialPlans?: PublicSubscriptionPlan[] }) {
  const { currentUser } = useSession();
  const { data: plans = [], isLoading, isError, refetch } = usePublicPlans(initialPlans);

  return (
    <div>
      {isLoading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {[0, 1, 2].map((index) => <div key={index} className="h-[30rem] animate-pulse bg-surface" />)}
        </div>
      ) : isError && plans.length === 0 ? (
        <div className="border border-error/25 bg-surface px-6 py-10 text-center">
          <p className="text-small text-error">Pricing plans could not be loaded.</p>
          <button onClick={() => refetch()} className="mt-3 text-small font-semibold text-navy underline">Try again</button>
        </div>
      ) : plans.length === 0 ? (
        <div className="border border-border bg-surface px-6 py-10 text-center text-small text-muted">No active plans are available right now.</div>
      ) : (
        <div className="grid auto-rows-fr grid-cols-1 items-stretch gap-5 md:grid-cols-3">
          {plans.map((plan) => {
            const custom = plan.kind === "CUSTOM";
            const billing = custom ? "" : plan.billingIntervalMonths == null
              ? "per event"
              : plan.billingIntervalMonths === 1
                ? "/ month"
                : plan.billingIntervalMonths === 12
                  ? "/ year"
                  : `every ${plan.billingIntervalMonths} months`;
            const features = [
              featureLimit("pageants", plan.maxPageants),
              featureLimit("tabulator users", plan.maxTabulatorUsers),
              featureLimit("judges per pageant", plan.maxJudgesPerPageant),
              featureLimit("rounds per pageant", plan.maxRoundsPerPageant),
              featureLimit("categories per round", plan.maxCategoriesPerRound),
              plan.publicVotingEnabled ? "Public voting included" : "Public voting not included",
              ...(plan.customizationEnabled ? ["Organization customization included"] : []),
            ];
            return (
              <article key={plan.id} className="flex h-full flex-col overflow-hidden rounded-sm bg-surface">
                <header className="flex items-center justify-between gap-2 bg-navy px-5 py-4">
                  <div>
                    <h2 className="text-caption font-semibold uppercase tracking-widest text-gold">{plan.name}</h2>
                    <p className="mt-0.5 text-caption text-white/55">{custom ? "Tailored for your organization" : plan.kind.replaceAll("_", " ").toLowerCase()}</p>
                  </div>
                  {custom && <span className="text-caption font-semibold uppercase tracking-wide text-gold/70">Custom</span>}
                </header>
                <div className="border-b border-border px-5 py-5">
                  <div className="flex items-baseline gap-2">
                    <p className="font-serif text-h1 font-bold leading-none text-charcoal">{formatPrice(plan.priceAmount, plan.currency)}</p>
                    {billing && <p className="text-small text-muted">{billing}</p>}
                  </div>
                  <p className="mt-3 text-small leading-relaxed text-muted">{custom ? "Contact us to discuss a plan configured for your needs." : `A ${plan.name} subscription with the limits shown below.`}</p>
                </div>
                <div className="flex-1 px-5 py-5">
                  <p className="mb-4 break-words text-caption font-semibold uppercase leading-relaxed tracking-[0.14em] text-gold/70">Plan limits and features</p>
                  <ul className="space-y-2.5">
                    {features.map((feature) => <li key={feature} className="flex items-start gap-2.5 text-small leading-snug text-charcoal"><span aria-hidden="true" className="mt-0.5 shrink-0 text-gold">✦</span>{feature}</li>)}
                  </ul>
                </div>
                <div className="border-t border-border px-5 pb-5 pt-5">
                  {currentUser && currentUser.role !== "org_owner" ? (
                    <Link href="/register">
                      <Button variant="secondary" size="md" fullWidth>
                        Register as an Organization Owner
                      </Button>
                    </Link>
                  ) : custom ? (
                    <Link href="/contact" className="inline-flex h-10 w-full items-center justify-center rounded-md bg-navy text-small font-medium text-white hover:bg-navy/90">Contact us</Link>
                  ) : (
                    <PublicDashboardLink href="/register" label="Get started" fullWidth />
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
