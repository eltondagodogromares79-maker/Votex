import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/src/components/ui/Button";
import { PublicPricingPlans } from "@/src/features/public/components/PublicPricingPlans";
import { PublicDashboardLink } from "@/src/features/public/components/PublicDashboardLink";
import { getPublicPlans } from "@/src/features/public/api/publicServer";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Compare Votex subscription plans and features for pageant organizers.",
  alternates: { canonical: "/pricing" },
};

const ALL_FEATURES = [
  "Real-time scoring",
  "Weighted criteria & categories",
  "Code-based judge login — no app needed",
  "Live tabulation grid for tabulators",
  "Candidate photo management",
  "Multi-round support",
  "Leaderboard with instant recalculation",
  "Role-based access control",
  
];

export default async function PricingPage() {
  const initialPlans = await getPublicPlans();
  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="bg-navy py-20">
        <div className="container-page">
          <p className="text-caption font-semibold uppercase tracking-[0.18em] text-gold mb-4">
            Pricing
          </p>
          <h1 className="font-serif font-bold text-white
                         text-[1.625rem] sm:text-[1.875rem] lg:text-[2.25rem]
                         leading-tight mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-small text-white/55 max-w-lg leading-relaxed">
            Pay per event, subscribe monthly, or talk to us for a custom plan.
            No hidden fees. No lock-in.
          </p>
        </div>
      </section>

      <div className="h-px bg-gold/25 w-full" />

      {/* ── Plans ─────────────────────────────────────────────────────── */}
      <section className="py-16 bg-slate">
        <div className="container-page">
          <PublicPricingPlans initialPlans={initialPlans ?? undefined} />

          {/* FAQ nudge */}
          <div className="mt-10 text-center">
            <p className="text-small text-muted">
              Questions about billing?{" "}
              <Link href="/faq" className="text-navy font-medium hover:underline">
                See our FAQ
              </Link>{" "}
              or{" "}
              <Link href="/contact" className="text-navy font-medium hover:underline">
                contact us
              </Link>.
            </p>
          </div>
        </div>
      </section>

      {/* ── All plans include ─────────────────────────────────────────── */}
      <section className="py-16 bg-surface">
        <div className="container-page">
          <div className="mb-10">
            <p className="text-caption font-semibold uppercase tracking-[0.18em] text-gold mb-3">
              Every plan
            </p>
            <h2 className="font-serif font-bold text-charcoal
                           text-[1.375rem] sm:text-[1.625rem] leading-tight">
              Everything you need, always included
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ALL_FEATURES.map((feature) => (
              <div key={feature}
                className="bg-slate rounded-sm px-5 py-4 flex items-center gap-3">
                <span className="text-gold shrink-0" aria-hidden="true">✦</span>
                <p className="text-small text-charcoal">{feature}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────── */}
      <section className="py-20 bg-navy text-center">
        <div className="container-page">
          <div className="w-8 h-px bg-gold/35 mx-auto mb-8" />
          <h2 className="font-serif font-bold text-gold text-h1 mb-4">
            Ready to run your first pageant?
          </h2>
          <p className="text-small text-white/55 mb-8 max-w-sm mx-auto leading-relaxed">
            Set up your event in minutes. No credit card required to start.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <PublicDashboardLink href="/register" label="Get started free" />
            <Link href="/contact">
              <Button variant="primary" size="md"
                className="text-white/60 border-white/15 hover:bg-white/8 hover:text-white">
                Talk to us
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
