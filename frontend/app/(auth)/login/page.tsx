"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ROLE_HOME } from "@/src/config/permissions";
import { AuthLogoBrandPanel, AuthLogoMobile } from "@/src/features/auth/components/AuthLogo";

// ── Icons ─────────────────────────────────────────────────────────────────────

function OrgOwnerIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
    </svg>
  );
}

function CoordinatorIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    </svg>
  );
}

function JudgeIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  );
}

function TabulatorIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75.125V5.625m0 12.75v-1.5m0 0a1.125 1.125 0 011.125-1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125m1.125-1.125V5.625m0 12.75h13.5m0-12.75h-13.5" />
    </svg>
  );
}

function AudienceIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg
      className="w-4 h-4 shrink-0 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150"
      fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}

// ── Role card ─────────────────────────────────────────────────────────────────
interface RoleCardProps {
  href: string;
  icon: React.ReactNode;
  role: string;
  tagline: string;
  description: string;
  accent?: boolean;
  muted?: boolean;
}

function RoleCard({ href, icon, role, tagline, description, accent, muted }: RoleCardProps) {
  return (
    <Link
      href={href}
      className={[
        "group flex items-center gap-4 px-4 py-3.5 border transition-all duration-150",
        "focus-visible:outline-2 focus-visible:outline-gold focus-visible:outline-offset-2",
        accent
          ? "bg-gold/8 border-gold/30 hover:bg-gold/12 hover:border-gold/50"
          : muted
          ? "bg-white/3 border-white/8 hover:bg-white/6 hover:border-white/15"
          : "bg-white/4 border-white/10 hover:bg-white/8 hover:border-white/20",
      ].join(" ")}
    >
      {/* Icon */}
      <div className={[
        "shrink-0 transition-colors duration-150",
        accent ? "text-gold" : muted ? "text-white/30 group-hover:text-white/55" : "text-white/40 group-hover:text-white/70",
      ].join(" ")}>
        {icon}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className={[
            "text-[0.65rem] font-semibold uppercase tracking-[0.14em]",
            accent ? "text-gold" : muted ? "text-white/30 group-hover:text-white/50" : "text-white/45 group-hover:text-white/65",
          ].join(" ")}>
            {role}
          </p>
        </div>
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="font-serif font-bold text-white text-[0.9375rem] leading-snug">
              {tagline}
            </p>
            <p className={[
              "text-caption leading-relaxed mt-0.5",
              muted ? "text-white/30" : "text-white/40",
            ].join(" ")}>
              {description}
            </p>
          </div>
          <ChevronRight />
        </div>
      </div>
    </Link>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
function LoginPageInner() {
  const router = useRouter();



  return (
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* ── LEFT brand panel ───────────────────────────────────────── */}
      <div className="hidden lg:block lg:w-5/12 xl:w-[45%] relative bg-navy overflow-hidden">
        <Image
          src="/auth-image.jpg"
          alt=""
          fill
          priority
          sizes="45vw"
          className="object-cover object-center"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to bottom, transparent 80%, rgba(15,30,54,0.6) 100%)" }}
        />
        <AuthLogoBrandPanel />
      </div>

      {/* ── RIGHT panel ────────────────────────────────────────────── */}
      <div className="flex-1 lg:w-7/12 xl:w-[55%] bg-navy flex flex-col">

        {/* Mobile top bar */}
        <div className="lg:hidden h-14 flex items-center px-6 border-b border-white/8">
          <AuthLogoMobile />
        </div>

        <div className="flex-1 flex items-center justify-center
                        px-6 sm:px-10 md:px-16 lg:px-12 xl:px-16 py-12">
          <div className="w-full max-w-[420px]">

            {/* Heading */}
            <div className="mb-7">
              <p className="text-caption font-semibold uppercase tracking-[0.18em] text-gold mb-3">
                Sign in
              </p>
              <div className="w-6 h-px bg-gold/35 mb-5" />
              <h1 className="font-serif font-bold text-white text-[1.5rem] leading-tight mb-1">
                Who are you?
              </h1>
              <p className="text-small text-white/50">
                Select your role to reach the right sign-in page.
              </p>
            </div>

            {/* ── Primary roles ─────────────────────────────────────── */}
            <div className="flex flex-col gap-2.5">

              {/* Org Owner — top-level, most prominent */}
              <RoleCard
                href="/login/org-owner"
                icon={<OrgOwnerIcon />}
                role="Organization Owner"
                tagline="Run your pageant organization"
                description="Create pageants, build your team, manage everything."
                accent
              />

              {/* Staff group */}
              <div className="flex flex-col gap-1.5">
                <p className="text-[0.6rem] uppercase tracking-[0.16em] text-white/25 px-1 pt-1">
                  Staff — account created by your Organization Owner
                </p>
                <RoleCard
                  href="/login/coordinator"
                  icon={<CoordinatorIcon />}
                  role="Coordinator"
                  tagline="Manage your pageant"
                  description="Handle rounds, candidates, judges, and scoring."
                />
                <RoleCard
                  href="/login/judge"
                  icon={<JudgeIcon />}
                  role="Judge"
                  tagline="Score candidates"
                  description="Access assigned rounds and submit your scores."
                />
                <RoleCard
                  href="/login/tabulator"
                  icon={<TabulatorIcon />}
                  role="Tabulator"
                  tagline="Monitor tabulation"
                  description="View live scores and manage round advancement."
                />
              </div>

              {/* Audience — separate section */}
              <div className="flex flex-col gap-1.5">
                <p className="text-[0.6rem] uppercase tracking-[0.16em] text-white/25 px-1 pt-1">
                  General access
                </p>
                <RoleCard
                  href="/login/audience"
                  icon={<AudienceIcon />}
                  role="Audience"
                  tagline="Follow the action"
                  description="Browse live pageants and cast your audience votes."
                  muted
                />
              </div>
            </div>

            {/* Register links */}
            <div className="mt-7 pt-5 border-t border-white/10">
              <p className="text-center text-small text-white/40 leading-relaxed">
                New here?{" "}
                <Link href="/register" className="text-gold font-semibold hover:underline underline-offset-2">
                  Register as an Org Owner
                </Link>
                {" "}or{" "}
                <Link href="/register/audience" className="text-gold font-semibold hover:underline underline-offset-2">
                  join as Audience
                </Link>
              </p>
            </div>

            {/* Legal */}
            <div className="flex items-center justify-center gap-3 mt-6">
              {(
                [["Terms", "/terms"], ["Privacy", "/privacy"], ["Contact", "/contact"]] as [string, string][]
              ).map(([label, href], i, a) => (
                <span key={href} className="flex items-center gap-3">
                  <Link href={href} className="text-caption text-white/30 hover:text-white/60 transition-colors">
                    {label}
                  </Link>
                  {i < a.length - 1 && (
                    <span className="text-white/20 text-caption" aria-hidden="true">✦</span>
                  )}
                </span>
              ))}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageInner />
    </Suspense>
  );
}
