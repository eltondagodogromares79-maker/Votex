import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { HOME_CONTENT } from "@/src/content/home";
import { SITE_CONFIG } from "@/src/config/site";
import { Button } from "@/src/components/ui/Button";
import { PublicDashboardLink } from "@/src/features/public/components/PublicDashboardLink";

export const metadata: Metadata = {
  title: "Pageant Management Platform",
  description: SITE_CONFIG.description,
  alternates: { canonical: "/" },
  openGraph: {
    title: "VoteX — Pageant Management Platform",
    description: SITE_CONFIG.description,
    url: "/",
    images: [{ url: "/hero-2.webp", alt: "VoteX pageant management platform" }],
  },
};

const MARQUEE_ITEMS = [
  "Pageant Setup",
  "Contestant Management",
  "Rounds & Categories",
  "Judge Scoring",
  "Tabulation",
  "Audience Voting",
];

// Unsplash photos — pageant / event / crown / stage themed
const IMG = {
  // Feature section visual
  features: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=900&q=80&auto=format&fit=crop",
  // Roles section — judges panel / audience at an event
  roles:    "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=900&q=80&auto=format&fit=crop",
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-caption font-semibold uppercase tracking-[0.18em] text-gold mb-4">
      {children}
    </p>
  );
}

function SectionRule({ align = "left" }: { align?: "left" | "center" }) {
  return (
    <div className={`w-8 h-px bg-gold/40 mb-8 ${align === "center" ? "mx-auto" : ""}`} />
  );
}

export default function HomePage() {
  const { hero, features, howItWorks, roles, cta } = HOME_CONTENT;

  return (
    <>
      {/* ════════════════════════════════════════════════════════════════
          HERO — local bg image, text in left col
      ════════════════════════════════════════════════════════════════ */}
      <section className="relative bg-navy overflow-hidden
                          min-h-[520px] sm:min-h-[560px] lg:min-h-[620px]">
       <div className="absolute inset-0 z-0
                lg:[mask-image:linear-gradient(to_left,black_60%,transparent_100%)]
                lg:[-webkit-mask-image:linear-gradient(to_left,black_10%,transparent_100%)]">
        <Image
          src="/hero-2.webp"
          alt=""
          fill
          preload
          sizes="100vw"
          quality={75}
          className="object-cover object-[75%_25%] lg:object-[center_25%]"
        />
      </div>
    <div className="absolute inset-0 z-10 bg-navy/75 lg:bg-navy/0" />
        <div className="absolute inset-0 z-10 bg-navy/85 lg:bg-navy/0" />
        <div className="container-page relative z-20
                        grid grid-cols-1 lg:grid-cols-2 min-h-[inherit]">
          <div className="flex flex-col justify-center
                          py-20 sm:py-24 lg:py-28
                          items-center text-center lg:items-start lg:text-left">
            <SectionLabel>Pageant Management Platform</SectionLabel>
            <h1 className="font-serif font-bold text-white leading-[1.15] mb-5
                           text-[1.625rem] sm:text-[1.875rem] lg:text-[2.25rem]">
              Run every pageant with{" "}
              <br className="hidden sm:block" />
              <span className="text-gold">precision</span>{" "}
              &amp;{" "}
              <span className="text-gold">elegance.</span>
            </h1>
            <p className="text-small text-white/60 leading-relaxed mb-8
                          max-w-[360px] mx-auto lg:mx-0">
              {hero.subheading}
            </p>
            <div className="w-8 h-px bg-gold/35 mb-8 hidden lg:block" />
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <PublicDashboardLink href="/register" label={hero.cta} loggedInLabel="Open Dashboard" linkClassName="w-full sm:w-auto" fullWidth />
              <Link href="/pricing" className="w-full sm:w-auto">
                <Button variant="primary" size="md" fullWidth
                  className="text-white/70 border-white/20 hover:bg-white/8 hover:text-white">
                  {hero.ctaSecondary}
                </Button>
              </Link>
            </div>
            <p className="text-caption text-white/30 mt-7 tracking-wide">
              For pageant owners, teams, judges, tabulators, and audiences
            </p>
          </div>
          <div aria-hidden="true" />
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          MARQUEE
      ════════════════════════════════════════════════════════════════ */}
      <div className="bg-gold overflow-hidden py-3" aria-hidden="true">
        <div className="marquee-track select-none">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((name, i) => (
            <span key={i}
              className="inline-flex items-center gap-3 px-6 whitespace-nowrap
                         font-serif font-semibold text-navy text-small tracking-wide">
              {name}
              <span className="text-navy/30 text-caption">✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          FEATURES
      ════════════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-surface">
        <div className="container-page">
          {/* items-stretch makes both grid cells the same height */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-stretch">

            {/* Left — heading + feature grid */}
            <div className="flex flex-col">
              <SectionLabel>Platform</SectionLabel>
              <SectionRule />
              <h2 className="font-serif font-bold text-charcoal text-h1 mb-3">
                {features.heading}
              </h2>
              <p className="text-small text-muted mb-8 leading-relaxed">
                {features.subheading}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-border flex-1">
                {features.items.map((f, i) => (
                  <div key={f.title}
                    className="bg-surface p-6 flex flex-col gap-2
                               hover:bg-slate transition-colors duration-200 group">
                    <span className="font-serif font-bold text-gold/25 text-[1.375rem]
                                     leading-none select-none group-hover:text-gold/50
                                     transition-colors">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3 className="font-serif font-semibold text-charcoal text-h3">
                      {f.title}
                    </h3>
                    <p className="text-small text-muted leading-relaxed">
                      {f.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — image fills full height of the left column */}
            <div className="relative rounded-sm overflow-hidden min-h-[340px]">
              <Image
                src={IMG.features}
                alt="Event space prepared for a pageant"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                quality={75}
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-navy/55" />
              <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                <p className="text-caption font-semibold uppercase tracking-[0.16em]
                              text-gold mb-4">
                  One connected workspace
                </p>
                <p className="max-w-md font-serif text-xl font-semibold leading-snug text-white sm:text-2xl">
                  Pageant setup, judging, tabulation, and audience voting.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {["Set up", "Score", "Review", "Publish"].map((step) => (
                    <span key={step} className="border border-white/25 bg-navy/40 px-3 py-1 text-caption text-white/85">
                      {step}
                    </span>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          HOW IT WORKS
      ════════════════════════════════════════════════════════════════ */}
      <section className="py-24 bg-navy">
        <div className="container-page">
          <div className="text-center mb-14">
            <SectionLabel>How it works</SectionLabel>
            <SectionRule align="center" />
            <h2 className="font-serif font-bold text-white text-h1">
              {howItWorks.heading}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-16 relative">
            <div className="hidden md:block absolute top-7
                            left-[calc(16.667%+2rem)] right-[calc(16.667%+2rem)]
                            h-px bg-white/8" />
            {howItWorks.steps.map((s, idx) => (
              <div key={s.number} className="text-center relative">
                <div className="w-14 h-14 rounded-full border border-gold/30
                                flex items-center justify-center mx-auto mb-5 relative z-10">
                  <span className="font-serif font-bold text-gold text-body">
                    0{idx + 1}
                  </span>
                </div>
                <h3 className="font-serif font-semibold text-white text-h3 mb-2">
                  {s.title}
                </h3>
                <p className="text-small text-white/45 leading-relaxed max-w-[220px] mx-auto">
                  {s.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          ROLES — image + cards side by side, inside container-page
      ════════════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-slate">
        <div className="container-page">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-stretch">

            {/* Left — image stretches to match card column height */}
            <div className="relative rounded-sm overflow-hidden
                            min-h-[320px] order-last lg:order-first">
              <Image
                src={IMG.roles}
                alt="Judges at a pageant event"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                quality={75}
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-navy/30" />
            </div>

            {/* Right — role cards */}
            <div className="flex flex-col">
              <SectionLabel>Built for your whole team</SectionLabel>
              <SectionRule />
              <h2 className="font-serif font-bold text-charcoal text-h1 mb-8">
                {roles.heading}
              </h2>
              <div className="flex flex-col gap-4">
                {roles.items.map((r) => (
                  <div key={r.role}
                    className="bg-surface rounded-sm overflow-hidden">
                    <div className="bg-navy px-5 py-3 flex items-center gap-3">
                      <span className="text-gold text-caption" aria-hidden="true">✦</span>
                      <div>
                        <p className="text-caption font-semibold uppercase
                                      tracking-widest text-gold/70">
                          {r.role}
                        </p>
                        <h3 className="font-serif font-bold text-white text-h3 leading-tight">
                          {r.tagline}
                        </h3>
                      </div>
                    </div>
                    <ul className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {r.capabilities.map((c) => (
                        <li key={c}
                          className="flex items-start gap-2 text-small text-muted leading-snug">
                          <span className="text-gold/60 mt-0.5 shrink-0"
                                aria-hidden="true">✦</span>
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          PRODUCT WORKFLOW — full-width image, workflow cards on top
      ════════════════════════════════════════════════════════════════ */}
      <section className="relative py-28 overflow-hidden">
        {/* Background image with strong navy overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1800&q=70&auto=format&fit=crop"
            alt=""
            fill
            sizes="100vw"
            quality={75}
            className="object-cover object-center"
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-navy/88" />
        </div>

        <div className="container-page relative z-10">
          <div className="text-center mb-14">
            <SectionLabel>How the parts connect</SectionLabel>
            <SectionRule align="center" />
            <h2 className="font-serif font-bold text-white text-h1">
              {HOME_CONTENT.workflow.heading}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {HOME_CONTENT.workflow.items.map((item, i) => (
              <div key={item.title}
                className="flex flex-col gap-6 bg-white/5 rounded-sm
                           border border-white/10 p-7
                           hover:bg-white/8 hover:border-gold/30
                           transition-colors duration-200">
                <span className="font-serif text-gold/50 text-caption font-semibold tracking-[0.18em]">
                  STEP 0{i + 1}
                </span>
                <h3 className="font-serif text-h3 font-semibold text-white">
                  {item.title}
                </h3>
                <p className="text-small text-white/70 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          FINAL CTA — image + copy side by side, inside container-page
      ════════════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-surface">
        <div className="container-page">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-stretch">

            {/* Left — image, same height as the right copy column */}
            <div className="relative rounded-sm overflow-hidden min-h-[280px]">
              <Image
                src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=900&q=80&auto=format&fit=crop"
                alt="Celebration at an event"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                quality={75}
                className="object-cover object-center"
              />
              {/* Lighter overlay so the image is visible */}
              <div className="absolute inset-0 bg-navy/25" />
            </div>

            {/* Right — copy */}
            <div className="flex flex-col justify-center">
              <div className="w-8 h-px bg-gold/40 mb-8" />
              <h2 className="font-serif font-bold text-charcoal text-h1 mb-4">
                {cta.heading}
              </h2>
              <p className="text-small text-muted mb-8 max-w-sm leading-relaxed">
                {cta.subheading}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <PublicDashboardLink href="/register" label={cta.button} />
                <Link href="/pricing">
                  <Button variant="primary" size="md">{cta.secondary}</Button>
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>
    </>
  );
}
