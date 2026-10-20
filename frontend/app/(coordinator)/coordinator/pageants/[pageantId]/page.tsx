"use client";

import { use, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import CoordinatorPageShell from "@/src/features/coordinator/components/CoordinatorPageShell";
import CoordinatorBadge from "@/src/features/coordinator/components/CoordinatorBadge";
import { useAssignedPageant, usePageantResourceLimits } from "@/src/features/coordinator/hooks/usePageants";

import CandidatesSection from "@/src/features/coordinator/components/management/CoordinatorCandidatesSection";
import CategoriesSection from "@/src/features/coordinator/components/management/CoordinatorCategoriesSection";
import RoundSection from "@/src/features/coordinator/components/management/CoordinatorRoundSection";
import JudgeSection from "@/src/features/coordinator/components/management/CoordinatorJudgesSection";
import TabulatorSection from "@/src/features/coordinator/components/management/CoordinatorTabulatorSection";
import CoordinatorPageantSettings from "@/src/features/coordinator/components/management/CoordinatorPageantSettings";
import CoordinatorLeaderboardsSection from "@/src/features/coordinator/components/management/CoordinatorLeaderboardsSection";
import { ApiError } from "@/src/lib/api/client";

// ── Status ────────────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<
  string,
  {
    label: string;
    variant: "success" | "navy" | "muted" | "gold" | "warning";
  }
> = {
  live: {
    label: "Live",
    variant: "success",
  },

  configuring: {
    label: "Configuring",
    variant: "gold",
  },

  draft: {
    label: "Draft",
    variant: "muted",
  },

  ready: {
    label: "Ready",
    variant: "navy",
  },

  paused: {
    label: "Paused",
    variant: "warning",
  },

  completed: {
    label: "Completed",
    variant: "muted",
  },

  archived: {
    label: "Archived",
    variant: "muted",
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(date: string | null) {
  if (!date) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

function formatTime(time: string | null) {
  if (!time) {
    return null;
  }

  const [hours, minutes] = time.split(":").map(Number);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return time;
  }

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return new Intl.DateTimeFormat("en-PH", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

// ── Pageant Logo ──────────────────────────────────────────────────────────────

function PageantLogo({
  logoUrl,
  name,
}: {
  logoUrl: string | null;
  name: string;
}) {
  if (logoUrl) {
    return (
      <div className="relative w-20 h-20 shrink-0 overflow-hidden rounded-xl border border-border bg-white">
        <Image
          src={logoUrl}
          alt={`${name} logo`}
          fill
          className="object-contain p-1"
          sizes="80px"
        />
      </div>
    );
  }

  return (
    <div
      className="w-20 h-20 shrink-0 rounded-xl border border-border bg-slate/50 flex items-center justify-center text-navy"
      aria-label={`${name} has no logo`}
    >
      <span className="text-2xl font-serif font-bold">
        {name.charAt(0).toUpperCase()}
      </span>
    </div>
  );
}

// ── Loading ───────────────────────────────────────────────────────────────────

function PageantDetailSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-4 w-24 bg-slate rounded mb-3" />

      <div className="h-8 w-72 bg-slate rounded mb-2" />

      <div className="h-4 w-96 max-w-full bg-slate rounded mb-6" />

      <div className="h-20 bg-navy/10 mb-6" />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="h-24 bg-slate rounded"
          />
        ))}
      </div>
    </div>
  );
}

// ── Management Section Types ─────────────────────────────────────────────────

type ManagementSection =
  | "overview"
  | "leaderboards"
  | "candidates"
  | "rounds"
  | "categories"
  | "judges"
  | "tabulators"
  | "settings";

const SECTION_DETAILS: Record<ManagementSection, { title: string; description: string }> = {
  overview: { title: "Overview", description: "A quick view of this pageant and its plan capacity." },
  leaderboards: { title: "Leaderboards", description: "Review contestant standings for this pageant." },
  candidates: { title: "Candidates", description: "Manage contestants participating in this pageant." },
  rounds: { title: "Rounds", description: "Set the stages and progression for this pageant." },
  categories: { title: "Categories", description: "Organize judging categories and their scoring criteria." },
  judges: { title: "Judges", description: "Manage the judging staff assigned to this pageant." },
  tabulators: { title: "Tabulators", description: "Manage scoring and tabulation staff for this organization." },
  settings: { title: "Settings", description: "Update pageant details and public visibility." },
};

function ResourceLimitNotice({ label, used, limit, hasActiveSubscription }: { label: string; used: number; limit: number | null; hasActiveSubscription: boolean }) {
  const percent = limit === null ? 0 : Math.min(100, limit > 0 ? used / limit * 100 : 100);
  const remaining = limit === null ? null : Math.max(0, limit - used);
  return <div className="mb-5 border border-border bg-white px-4 py-3 sm:flex sm:items-center sm:justify-between sm:gap-5">
    <div><p className="text-sm font-semibold text-charcoal">{label} capacity</p><p className="mt-0.5 text-xs text-muted">{!hasActiveSubscription ? "No active organization subscription found." : `${used} used${limit === null ? " · unlimited on your plan" : ` of ${limit} · ${remaining} remaining`}`}</p></div>
    {hasActiveSubscription && limit !== null ? <div className="mt-3 h-1.5 w-full overflow-hidden bg-slate sm:mt-0 sm:max-w-48"><div className={`h-full ${remaining === 0 ? "bg-red-500" : remaining !== null && remaining <= 1 ? "bg-amber-500" : "bg-gold"}`} style={{ width: `${percent}%` }} /></div> : hasActiveSubscription ? <span className="mt-2 inline-flex text-[10px] font-semibold uppercase tracking-wider text-green-700 sm:mt-0">No plan cap</span> : null}
  </div>;
}

function ResourceUsageCard({ label, used, limit, hasActiveSubscription }: { label: string; used: number; limit: number | null; hasActiveSubscription: boolean }) {
  const remaining = limit === null ? null : Math.max(0, limit - used);
  const percent = limit === null ? 0 : Math.min(100, limit > 0 ? (used / limit) * 100 : 100);

  return (
    <article className="border border-border bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.13em] text-muted">{label}</p>
          <p className="mt-2 font-serif text-2xl font-semibold text-charcoal">{used}<span className="ml-1 text-sm font-sans font-medium text-muted">used</span></p>
        </div>
        <span className="flex h-9 w-9 items-center justify-center border border-gold/30 bg-gold/10 text-sm font-bold text-navy" aria-hidden="true">{label.charAt(0)}</span>
      </div>
      <div className="mt-4">
        {!hasActiveSubscription ? (
          <p className="text-xs leading-relaxed text-muted">An active subscription is needed to view your resource allowance.</p>
        ) : limit === null ? (
          <p className="text-xs font-medium text-green-700">Unlimited on your current plan</p>
        ) : (
          <>
            <div className="mb-2 flex items-center justify-between gap-2 text-xs">
              <span className="text-muted">{remaining} remaining</span>
              <span className="font-semibold tabular-nums text-charcoal">of {limit}</span>
            </div>
            <div className="h-1.5 overflow-hidden bg-slate" role="progressbar" aria-label={`${label} plan usage`} aria-valuemin={0} aria-valuemax={limit} aria-valuenow={Math.min(used, limit)}>
              <div className={`h-full transition-[width] ${remaining === 0 ? "bg-red-500" : remaining !== null && remaining <= 1 ? "bg-amber-500" : "bg-gold"}`} style={{ width: `${percent}%` }} />
            </div>
          </>
        )}
      </div>
    </article>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PageantDetailPage({
  params,
}: {
  params: Promise<{ pageantId: string }>;
}) {
  const { pageantId } = use(params);

  const [activeSection, setActiveSection] = useState<ManagementSection>("overview");
  const [focusRoundId, setFocusRoundId] = useState<string | null>(null);
  const { data: limits } = usePageantResourceLimits(pageantId);

  const {
    data: pageant,
    isLoading,
    isError,
    error,
  } = useAssignedPageant(pageantId);

  useEffect(() => {
    const validSections: ManagementSection[] = ["overview", "leaderboards", "candidates", "rounds", "categories", "judges", "tabulators", "settings"];
    const syncFromUrl = () => {
      const requested = new URLSearchParams(window.location.search).get("section") as ManagementSection | null;
      setActiveSection(requested && validSections.includes(requested) ? requested : "overview");
    };
    const handleSection = (event: Event) => {
      const requested = (event as CustomEvent<ManagementSection>).detail;
      if (validSections.includes(requested)) setActiveSection(requested);
    };
    syncFromUrl();
    window.addEventListener("popstate", syncFromUrl);
    window.addEventListener("coordinator:section", handleSection);
    return () => {
      window.removeEventListener("popstate", syncFromUrl);
      window.removeEventListener("coordinator:section", handleSection);
    };
  }, []);

  function navigateToSection(section: ManagementSection) {
    setActiveSection(section);
    const url = new URL(window.location.href);
    url.searchParams.set("section", section);
    window.history.pushState({}, "", url);
    window.dispatchEvent(new CustomEvent("coordinator:section", { detail: section }));
  }

  // ── Loading ─────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <CoordinatorPageShell
        title="Loading pageant..."
        subtitle="Loading pageant details."
        breadcrumbs={[
          {
            label: "Assigned pageants",
            href: "/coordinator/pageants",
          },
          {
            label: "Pageants",
            href: "/coordinator/pageants",
          },
          {
            label: "Loading...",
          },
        ]}
      >
        <PageantDetailSkeleton />
      </CoordinatorPageShell>
    );
  }

  // ── Error ───────────────────────────────────────────────────────────────────

  if (isError || !pageant) {
    const waitingForPublication = error instanceof ApiError && error.status === 409;
    return (
      <CoordinatorPageShell
        title={waitingForPublication ? "Pageant not published yet" : "Pageant unavailable"}
        subtitle={waitingForPublication ? "Dashboard access will be available once the organization publishes this pageant." : "We couldn't load this pageant."}
        breadcrumbs={[
          {
            label: "Assigned pageants",
            href: "/coordinator/pageants",
          },
          {
            label: "Pageants",
            href: "/coordinator/pageants",
          },
        ]}
      >
        <div className="border border-border bg-surface p-6">
          <p className="text-small text-charcoal mb-4">
            {waitingForPublication
              ? "This pageant is still a draft. You can open its dashboard after it has been published."
              : "The pageant could not be found or you do not have permission to access it."}
          </p>

          <Link
            href="/coordinator/pageants"
            className="text-small font-semibold text-navy hover:underline"
          >
            ← Back to Pageants
          </Link>
        </div>
      </CoordinatorPageShell>
    );
  }

  // ── Pageant data ────────────────────────────────────────────────────────────

  const status = STATUS_BADGE[pageant.status];

  const startTime = formatTime(pageant.startTime);
  const endTime = formatTime(pageant.endTime);

  const eventTime =
    startTime && endTime
      ? `${startTime} – ${endTime}`
      : startTime ?? endTime ?? "Not set";

  // ── Page ────────────────────────────────────────────────────────────────────

  return (
    <CoordinatorPageShell
      pageantTitle={pageant.name}
      title={SECTION_DETAILS[activeSection].title}
      subtitle={SECTION_DETAILS[activeSection].description}
      breadcrumbs={[
        {
          label: "Assigned pageants",
          href: "/coordinator/pageants",
        },
        {
          label: "Pageants",
          href: "/coordinator/pageants",
        },
        {
          label: pageant.name,
        },
      ]}
    >
      {activeSection === "overview" ? <>
        <section className="relative isolate mb-7 min-h-[280px] overflow-hidden border border-navy/10 bg-navy sm:min-h-[340px]">
          {pageant.logoUrl ? <Image src={pageant.logoUrl} alt={`${pageant.name} event image`} fill priority className="-z-20 object-cover" sizes="(max-width: 768px) 100vw, 1200px" /> : null}
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-navy via-navy/85 to-navy/35" />
          <div className="relative flex min-h-[280px] flex-col justify-end p-6 sm:min-h-[340px] sm:p-9 lg:max-w-3xl">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <CoordinatorBadge variant={status?.variant ?? "muted"} className="border border-white/15 bg-white/10 text-white">{status?.label ?? pageant.status}</CoordinatorBadge>
              <span className="inline-flex items-center border border-white/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.13em] text-white/80">{pageant.isPublic ? "Public event" : "Private event"}</span>
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">{pageant.organizationName}</p>
            <h2 className="mt-2 font-serif text-3xl font-bold leading-tight text-white sm:text-4xl">{pageant.name}</h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/70">{pageant.venue ? `Event venue: ${pageant.venue}` : "Event information and configuration for this pageant."}</p>
            <p className="mt-5 text-xs font-medium text-white/50">/{pageant.slug}</p>
          </div>
          <div className="pointer-events-none absolute -right-20 -top-28 -z-10 h-80 w-80 rounded-full border border-gold/20" />
          <div className="pointer-events-none absolute -right-4 -top-12 -z-10 h-56 w-56 rounded-full border border-gold/10" />
        </section>

        <section aria-label="Pageant details" className="mb-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Event date", value: formatDate(pageant.eventDate), marker: "01" },
            { label: "Event time", value: eventTime, marker: "02" },
            { label: "Venue", value: pageant.venue ?? "Not set", marker: "03" },
            { label: "Visibility", value: pageant.isPublic ? "Public" : "Private", marker: "04" },
          ].map((item) => <article key={item.label} className="flex min-h-[104px] items-start gap-3 border border-border bg-white p-4 sm:p-5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-navy text-[10px] font-bold tracking-wider text-gold">{item.marker}</span>
            <div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">{item.label}</p><p className="mt-1 break-words text-sm font-semibold leading-snug text-charcoal">{item.value}</p></div>
          </article>)}
        </section>

        <section aria-labelledby="pageant-limits-title">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2 border-b border-border pb-3">
            <div><p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-gold">Subscription capacity</p><h3 id="pageant-limits-title" className="mt-1 font-serif text-xl font-semibold text-charcoal">Plan limits</h3></div>
            <p className="text-xs text-muted">Track resources used for this pageant.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <ResourceUsageCard label="Rounds" used={limits?.roundsUsed ?? 0} limit={limits?.maxRoundsPerPageant ?? null} hasActiveSubscription={limits?.hasActiveSubscription ?? false} />
            <ResourceUsageCard label="Judges" used={limits?.judgesUsed ?? 0} limit={limits?.maxJudgesPerPageant ?? null} hasActiveSubscription={limits?.hasActiveSubscription ?? false} />
            <ResourceUsageCard label="Tabulators" used={limits?.tabulatorsUsed ?? 0} limit={limits?.maxTabulatorUsers ?? null} hasActiveSubscription={limits?.hasActiveSubscription ?? false} />
          </div>
        </section>
      </> : null}

      {activeSection === "leaderboards" ? <CoordinatorLeaderboardsSection pageantId={pageantId} /> : null}

      {activeSection === "candidates" ? <CandidatesSection pageantId={pageantId} /> : null}
      {activeSection === "rounds" ? <>
        <ResourceLimitNotice label="Rounds" used={limits?.roundsUsed ?? 0} limit={limits?.maxRoundsPerPageant ?? null} hasActiveSubscription={limits?.hasActiveSubscription ?? false} />
        <RoundSection pageantId={pageantId} onManageRound={(roundId) => { setFocusRoundId(roundId); navigateToSection("categories"); }} />
      </> : null}
      {activeSection === "categories" ? <CategoriesSection key={focusRoundId ?? "all-rounds"} pageantId={pageantId} focusRoundId={focusRoundId} /> : null}
      {activeSection === "judges" ? <>
        <ResourceLimitNotice label="Judges" used={limits?.judgesUsed ?? 0} limit={limits?.maxJudgesPerPageant ?? null} hasActiveSubscription={limits?.hasActiveSubscription ?? false} />
        <JudgeSection pageantId={pageantId} />
      </> : null}
      {activeSection === "tabulators" ? <>
        <ResourceLimitNotice label="Tabulators" used={limits?.tabulatorsUsed ?? 0} limit={limits?.maxTabulatorUsers ?? null} hasActiveSubscription={limits?.hasActiveSubscription ?? false} />
        <TabulatorSection pageantId={pageantId} />
      </> : null}
      {activeSection === "settings" ? <CoordinatorPageantSettings pageant={pageant} /> : null}
    </CoordinatorPageShell>
  );
}
