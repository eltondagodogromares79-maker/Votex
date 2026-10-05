import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ABOUT_CONTENT } from "@/src/content/about";
import { Button } from "@/src/components/ui/Button";

export const metadata: Metadata = {
  title: "About",
  description: "Learn about the Votex platform, our mission, and how it works.",
};

// Unsplash images — event / stage / teamwork themed
const IMG = {
  mission:    "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=900&q=80&auto=format&fit=crop",
  howItWorks: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=900&q=80&auto=format&fit=crop",
  values:     "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=900&q=80&auto=format&fit=crop",
  team:       "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=900&q=80&auto=format&fit=crop",
};

export default function AboutPage() {
  const { hero, mission, howItWorks, values, team } = ABOUT_CONTENT;

  return (
    <>
      {/* ── Hero — untouched ──────────────────────────────────────────── */}
      <section className="bg-navy py-20">
        <div className="container-page">
          <p className="text-caption font-semibold uppercase tracking-[0.18em] text-gold mb-4">
            About Votex
          </p>
          <h1 className="font-serif font-bold text-white
                         text-[1.625rem] sm:text-[1.875rem] lg:text-[2.25rem]
                         leading-tight mb-4 max-w-2xl">
            {hero.heading}
          </h1>
          <p className="text-small text-white/55 max-w-lg leading-relaxed">
            {hero.subheading}
          </p>
        </div>
      </section>

      <div className="h-px bg-gold/25 w-full" />

      {/* ── Mission — text left, image right ──────────────────────────── */}
      <section className="py-20 bg-slate">
        <div className="container-page">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-stretch">

            {/* Left — text */}
            <div className="flex flex-col justify-center">
              <p className="text-caption font-semibold uppercase tracking-[0.18em] text-gold mb-4">
                Our Mission
              </p>
              <div className="w-6 h-px bg-gold/35 mb-6" />
              <h2 className="font-serif font-bold text-charcoal
                             text-[1.375rem] sm:text-[1.625rem] leading-tight mb-5">
                {mission.heading}
              </h2>
              <p className="text-small text-muted leading-relaxed mb-8">
                {mission.body}
              </p>
              {/* Key points */}
              <div className="flex flex-col gap-3">
                {[
                  "From school-level to national events",
                  "Precision results, zero spreadsheets",
                  "Built by people who've run pageants",
                ].map((pt) => (
                  <div key={pt} className="flex items-start gap-3">
                    <span className="text-gold shrink-0 mt-0.5" aria-hidden="true">✦</span>
                    <p className="text-small text-charcoal">{pt}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — image */}
            <div className="relative rounded-sm overflow-hidden min-h-[300px]">
              <Image
                src={IMG.mission}
                alt="Event venue"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-navy/20" />
            </div>

          </div>
        </div>
      </section>

      {/* ── How it works — image left, steps right ────────────────────── */}
      <section className="py-20 bg-surface">
        <div className="container-page">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-stretch">

            {/* Left — image */}
            <div className="relative rounded-sm overflow-hidden min-h-[300px]
                            order-last lg:order-first">
              <Image
                src={IMG.howItWorks}
                alt="Judges at a pageant"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-navy/25" />
            </div>

            {/* Right — steps */}
            <div className="flex flex-col justify-center">
              <p className="text-caption font-semibold uppercase tracking-[0.18em] text-gold mb-4">
                The process
              </p>
              <div className="w-6 h-px bg-gold/35 mb-6" />
              <h2 className="font-serif font-bold text-charcoal
                             text-[1.375rem] sm:text-[1.625rem] leading-tight mb-8">
                {howItWorks.heading}
              </h2>

              <div className="flex flex-col gap-5">
                {howItWorks.steps.map((step, idx) => (
                  <div key={step.step} className="flex items-start gap-4">
                    {/* Step number */}
                    <div className="w-10 h-10 rounded-full border border-gold/30
                                    flex items-center justify-center shrink-0 mt-0.5">
                      <span className="font-serif font-bold text-gold text-small">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <div>
                      <p className="font-serif font-semibold text-charcoal text-h3 mb-1">
                        {step.title}
                      </p>
                      <p className="text-small text-muted leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Values — full-width bg image, cards overlay ───────────────── */}
      <section className="relative py-24 overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0 z-0">
          <Image
            src={IMG.values}
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-center"
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-navy/85" />
        </div>

        <div className="container-page relative z-10">
          <div className="text-center mb-12">
            <p className="text-caption font-semibold uppercase tracking-[0.18em] text-gold mb-4">
              What we stand for
            </p>
            <div className="w-6 h-px bg-gold/35 mx-auto mb-6" />
            <h2 className="font-serif font-bold text-white
                           text-[1.375rem] sm:text-[1.625rem] leading-tight">
              Our values
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {values.map((v) => (
              <div key={v.title}
                className="bg-white/5 border border-white/10 rounded-sm p-7
                           hover:bg-white/8 hover:border-gold/30
                           transition-colors duration-200">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-gold" aria-hidden="true">✦</span>
                  <p className="text-caption font-semibold uppercase tracking-widest text-gold/80">
                    {v.title}
                  </p>
                </div>
                <p className="text-small text-white/65 leading-relaxed">
                  {v.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Team — image left, bio right ──────────────────────────────── */}
      <section className="py-20 bg-slate">
        <div className="container-page">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-stretch">

            {/* Left — image */}
            <div className="relative rounded-sm overflow-hidden min-h-[300px]">
              <Image
                src={IMG.team}
                alt="The Votex team"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-navy/30" />
            </div>

            {/* Right — team info */}
            <div className="flex flex-col justify-center">
              <p className="text-caption font-semibold uppercase tracking-[0.18em] text-gold mb-4">
                The team
              </p>
              <div className="w-6 h-px bg-gold/35 mb-6" />
              <h2 className="font-serif font-bold text-charcoal
                             text-[1.375rem] sm:text-[1.625rem] leading-tight mb-8">
                Who we are
              </h2>

              {team.map((member) => (
                <div key={member.name} className="flex flex-col gap-4">
                  {/* Avatar + name row */}
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-navy flex items-center
                                    justify-center shrink-0 border border-gold/20">
                      <span className="font-serif font-bold text-gold text-h3">
                        {member.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-serif font-bold text-charcoal text-h3">
                        {member.name}
                      </p>
                      <p className="text-caption text-gold/70">{member.role}</p>
                    </div>
                  </div>

                  <div className="w-full h-px bg-border" />

                  <p className="text-small text-muted leading-relaxed">
                    {member.bio}
                  </p>

                  {/* Social / contact hint */}
                  <div className="flex items-center gap-2 mt-2">
                    <Link href="/contact">
                      <Button variant="ghost" size="sm"
                        className="text-navy border-navy/20 hover:bg-navy hover:text-white">
                        Get in touch
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────── */}
      <section className="py-20 bg-navy text-center">
        <div className="container-page">
          <div className="w-8 h-px bg-gold/35 mx-auto mb-8" />
          <h2 className="font-serif font-bold text-gold text-h1 mb-4">
            Ready to run a flawless pageant?
          </h2>
          <p className="text-small text-white/55 mb-8 max-w-md mx-auto leading-relaxed">
            Join coordinators across the Philippines who trust Votex for
            live scoring and real-time results.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register">
              <Button variant="secondary" size="md">Get started free</Button>
            </Link>
            <Link href="/contact">
              <Button variant="ghost" size="md"
                className="text-white/60 border-white/15 hover:bg-white/8 hover:text-white">
                Contact us
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
