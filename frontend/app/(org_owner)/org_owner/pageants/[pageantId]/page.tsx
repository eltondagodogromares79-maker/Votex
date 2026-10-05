"use client";

import { use } from "react";
import Link from "next/link";
import OrgPageShell from "@/src/features/org_owner/components/OrgPageShell";
import OrgBadge from "@/src/features/org_owner/components/OrgBadge";
import { useSession } from "@/src/features/auth/context/SessionContext";
import { usePageant } from "@/src/features/org_owner/hooks/usePageants";
import { useVoteRevenue } from "@/src/features/org_owner/hooks/useTransactions";

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_VARIANT: Record<string, "success" | "gold" | "navy" | "muted" | "warning"> = {
  live: "success", ready: "navy", configuring: "gold",
  draft: "muted", paused: "warning", completed: "muted", archived: "muted",
};

const STATUS_DOT: Record<string, string> = {
  live: "bg-success animate-pulse", ready: "bg-navy", configuring: "bg-gold",
  draft: "bg-border", paused: "bg-warning", completed: "bg-border", archived: "bg-border",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`bg-surface border border-border animate-pulse ${className}`} />;
}

function DetailCard({
  icon, label, value,
}: {
  icon: React.ReactNode; label: string; value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 p-4 bg-surface border border-border">
      <div className="w-8 h-8 bg-navy/8 flex items-center justify-center shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-caption text-muted uppercase tracking-[0.1em] mb-0.5">{label}</p>
        <p className="text-small font-semibold text-charcoal leading-tight">{value}</p>
      </div>
    </div>
  );
}

function QuickLink({ href, icon, label, description }: {
  href: string; icon: React.ReactNode; label: string; description: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 px-5 py-4 bg-surface border border-border hover:border-navy/50 hover:bg-slate/30 transition-all"
    >
      <div className="w-9 h-9 bg-navy flex items-center justify-center shrink-0 group-hover:bg-navy/90 transition-colors">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-small font-semibold text-charcoal group-hover:text-navy transition-colors">{label}</p>
        <p className="text-caption text-muted mt-0.5 leading-relaxed">{description}</p>
      </div>
      <svg className="w-4 h-4 text-muted group-hover:text-navy group-hover:translate-x-0.5 transition-all shrink-0"
        fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
      </svg>
    </Link>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const CalendarIcon = () => (
  <svg className="w-4 h-4 text-navy/60" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-4 h-4 text-navy/60" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const LocationIcon = () => (
  <svg className="w-4 h-4 text-navy/60" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
  </svg>
);

const GlobeIcon = () => (
  <svg className="w-4 h-4 text-navy/60" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
  </svg>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PageantDashboardPage({
  params,
}: {
  params: Promise<{ pageantId: string }>;
}) {
  const { pageantId } = use(params);
  const { currentUser } = useSession();
  const orgId = currentUser?.organizationId ?? "";

  const { data: pageant, isLoading, isError } = usePageant(orgId, pageantId);
  const { data: revenue } = useVoteRevenue(orgId, { pageantId });

  if (isLoading) {
    return (
      <OrgPageShell title="Pageant" breadcrumbs={[
        { label: "Pageants", href: "/org_owner/pageants" },
        { label: "Loading…" },
      ]}>
        <div className="space-y-4">
          <Skeleton className="h-36" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20" />)}
          </div>
        </div>
      </OrgPageShell>
    );
  }

  if (isError || !pageant) {
    return (
      <OrgPageShell title="Pageant Not Found"
        breadcrumbs={[{ label: "Pageants", href: "/org_owner/pageants" }]}>
        <div className="bg-error/8 border border-error/20 px-5 py-5">
          <p className="text-small font-semibold text-error">Pageant not found.</p>
          <p className="text-caption text-muted mt-1">This pageant could not be found or you don't have access to it.</p>
        </div>
      </OrgPageShell>
    );
  }

  const formattedDate = pageant.eventDate
    ? new Date(pageant.eventDate).toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
    : null;

  const timeRange = pageant.startTime
    ? `${pageant.startTime}${pageant.endTime ? ` → ${pageant.endTime}` : ""}`
    : null;

  const totals      = revenue?.totalsByCurrency ?? [];
  const hasRevenue  = totals.length > 0;
  const totalAmount = hasRevenue
    ? parseFloat(totals[0].amount).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "0.00";
  const currency    = hasRevenue ? totals[0].currency : "PHP";
  const votesSold   = hasRevenue ? totals.reduce((s, t) => s + t.votesSold, 0) : 0;
  const txCount     = hasRevenue ? totals.reduce((s, t) => s + t.completedTransactions, 0) : 0;

  return (
    <OrgPageShell
      title={pageant.name}
      breadcrumbs={[
        { label: "Pageants", href: "/org_owner/pageants" },
        { label: pageant.name },
      ]}
      action={
        <Link
          href={`/org_owner/pageants/${pageantId}/settings`}
          className="inline-flex items-center gap-2 h-9 px-4 bg-navy text-white text-small font-medium hover:bg-navy/90 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Settings
        </Link>
      }
    >

      {/* ── Revenue panel (top, navy) ─────────────────────────────────────── */}
      <section className="bg-navy mb-6">
        {/* Gold top bar */}
        <div className="h-0.5 bg-gold w-full" />

        <div className="px-6 py-5 sm:px-8">
          {/* Header row */}
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="flex items-center gap-2.5">
              <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[pageant.status] ?? "bg-border"}`} />
              <OrgBadge variant={STATUS_VARIANT[pageant.status] ?? "muted"}>
                {pageant.status.toUpperCase()}
              </OrgBadge>
              {pageant.isPublic && <OrgBadge variant="success">Public</OrgBadge>}
            </div>
            <Link
              href="/org_owner/billing/transactions"
              className="inline-flex items-center gap-1.5 text-caption text-white/40 hover:text-gold transition-colors shrink-0"
            >
              View transactions
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-white/8">

            {/* Total Revenue — primary, wider feel */}
            <div className="bg-navy px-5 py-4 sm:col-span-1">
              <p className="text-caption text-white/40 uppercase tracking-[0.1em] mb-2">Total Revenue</p>
              <div className="flex items-baseline gap-2">
                <span className="text-small font-medium text-white/50">{currency}</span>
                <span className="font-serif font-bold text-gold text-[2rem] leading-none tabular-nums">
                  {totalAmount}
                </span>
              </div>
              {!hasRevenue && (
                <p className="text-caption text-white/25 mt-1.5">No transactions yet</p>
              )}
            </div>

            {/* Votes Sold */}
            <div className="bg-navy px-5 py-4">
              <p className="text-caption text-white/40 uppercase tracking-[0.1em] mb-2">Votes Sold</p>
              <div className="flex items-baseline gap-2">
                <span className="font-serif font-bold text-white text-[2rem] leading-none tabular-nums">
                  {votesSold.toLocaleString()}
                </span>
              </div>
              <p className="text-caption text-white/25 mt-1.5">
                {hasRevenue ? "total votes purchased" : "No votes yet"}
              </p>
            </div>

            {/* Transactions */}
            <div className="bg-navy px-5 py-4">
              <p className="text-caption text-white/40 uppercase tracking-[0.1em] mb-2">Transactions</p>
              <div className="flex items-baseline gap-2">
                <span className="font-serif font-bold text-white text-[2rem] leading-none tabular-nums">
                  {txCount.toLocaleString()}
                </span>
              </div>
              <p className="text-caption text-white/25 mt-1.5">
                {hasRevenue ? "completed" : "No transactions yet"}
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ── Event detail cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <DetailCard
          icon={<CalendarIcon />}
          label="Event Date"
          value={formattedDate ?? <span className="text-muted font-normal">Not set</span>}
        />
        <DetailCard
          icon={<ClockIcon />}
          label="Time"
          value={timeRange ?? <span className="text-muted font-normal">Not set</span>}
        />
        <DetailCard
          icon={<LocationIcon />}
          label="Venue"
          value={pageant.venue ?? <span className="text-muted font-normal">Not set</span>}
        />
        <DetailCard
          icon={<GlobeIcon />}
          label="Visibility"
          value={pageant.isPublic ? "Public" : "Private"}
        />
      </div>

      {/* ── Quick actions ────────────────────────────────────────────────── */}
      <section>
        <h2 className="font-serif font-semibold text-charcoal text-h3 mb-4">Manage Pageant</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">

          <QuickLink
            href={`/org_owner/pageants/${pageantId}/settings`}
            label="Edit Settings"
            description="Update name, schedule, venue, and visibility"
            icon={
              <svg className="w-4.5 h-4.5 text-gold" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
          />

          <QuickLink
            href={`/org_owner/pageants/${pageantId}/vote-packages`}
            label="Vote Packages"
            description="Create and manage vote packages for this pageant"
            icon={
              <svg className="w-4.5 h-4.5 text-gold" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
              </svg>
            }
          />

          <QuickLink
            href={`/org_owner/pageants/${pageantId}/staff`}
            label="Manage Staff"
            description="Assign coordinators, judges, and tabulators to this pageant"
            icon={
              <svg className="w-4.5 h-4.5 text-gold" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
            }
          />

          <QuickLink
            href="/org_owner/billing/transactions"
            label="Vote Revenue"
            description="View voting transactions and revenue reports"
            icon={
              <svg className="w-4.5 h-4.5 text-gold" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
              </svg>
            }
          />

        </div>
      </section>

    </OrgPageShell>
  );
}
