import type { Metadata } from "next";
import Link from "next/link";
import { PRICING_PLANS, formatPlanPrice, BILLING_PERIOD_LABELS } from "@/src/lib/pricing";
import { Button } from "@/src/components/ui/Button";
import { SITE_CONFIG } from "@/src/config/site";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "₱449 per event, ₱999/month for 3 pageants, or contact us for a custom enterprise plan.",
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

export default function PricingPage() {
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
            {PRICING_PLANS.map((plan) => {
              const isEnterprise = plan.price === null;

              return (
                <div
                  key={plan.id}
                  className={`bg-surface rounded-sm overflow-hidden flex flex-col relative
                    hover:translate-y-[-2px] transition-transform duration-200
                    ${plan.highlighted ? "ring-2 ring-gold" : ""}`}
                >
                  {/* Recommended badge */}
                  {plan.highlighted && (
                    <div className="absolute -top-3.5 left-0 right-0 flex justify-center z-10">
                      <span className="bg-gold text-navy text-caption font-bold
                                       px-4 py-0.5 tracking-wide uppercase">
                        Recommended
                      </span>
                    </div>
                  )}

                  {/* Card header — navy band */}
                  <div className="bg-navy px-5 py-4 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-caption font-semibold uppercase tracking-widest text-gold">
                        {plan.name}
                      </p>
                      <p className="text-caption text-white/45 mt-0.5">{plan.tagline}</p>
                    </div>
                    {isEnterprise && (
                      <span className="text-caption font-semibold text-gold/60 uppercase tracking-wide">
                        Custom
                      </span>
                    )}
                  </div>

                  {/* Price block */}
                  <div className="px-5 py-5 border-b border-border">
                    {isEnterprise ? (
                      <p className="font-serif font-bold text-charcoal text-h1 leading-none mb-1">
                        Let&apos;s talk
                      </p>
                    ) : (
                      <div className="flex items-baseline gap-1.5 mb-1">
                        <p className="font-serif font-bold text-charcoal text-h1 leading-none">
                          {formatPlanPrice(plan)}
                        </p>
                        <p className="text-small text-muted">
                          {BILLING_PERIOD_LABELS[plan.billing]}
                        </p>
                      </div>
                    )}
                    <p className="text-small text-muted leading-relaxed mt-2">
                      {plan.description}
                    </p>
                  </div>

                  {/* Features */}
                  <div className="px-5 py-5 flex-1">
                    <p className="text-caption font-semibold uppercase tracking-[0.14em]
                                  text-gold/60 mb-4">
                      What&apos;s included
                    </p>
                    <ul className="space-y-2.5">
                      {plan.features.map((f) => (
                        <li key={f}
                          className="flex items-start gap-2.5 text-small text-charcoal leading-snug">
                          <span className="text-gold mt-0.5 shrink-0" aria-hidden="true">✦</span>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA */}
                  <div className="px-5 pb-5 border-t border-border pt-5">
                    <Link href={plan.ctaHref}>
                      <Button
                        variant={plan.highlighted ? "secondary" : "primary"}
                        size="md"
                        fullWidth
                      >
                        {plan.cta}
                      </Button>
                    </Link>
                    {isEnterprise && (
                      <p className="text-caption text-muted text-center mt-3">
                        or email{" "}
                        <a
                          href={`mailto:${SITE_CONFIG.contact.email}`}
                          className="text-navy hover:underline"
                        >
                          {SITE_CONFIG.contact.email}
                        </a>
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

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
            <Link href="/register">
              <Button variant="secondary" size="md">Get started free</Button>
            </Link>
            <Link href="/contact">
              <Button variant="ghost" size="md"
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
