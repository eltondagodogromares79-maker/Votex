"use client";

import { useState } from "react";
import Link from "next/link";
import AdminPageShell from "@/src/features/admin/components/AdminPageShell";
import { useOrganizations } from "@/src/features/admin/hooks/useOrganizations";
import type { AdminOrganizationResponse } from "@/src/types";

const PAGE_SIZE = 50;

const SUB_STATUS_STYLES: Record<string, string> = {
  ACTIVE:   "bg-success/8 border-success/25 text-success",
  TRIALING: "bg-gold/10 border-gold/30 text-gold",
  PAST_DUE: "bg-error/8 border-error/25 text-error",
  PAUSED:   "bg-border/30 border-border text-muted",
  PENDING_PAYMENT: "bg-warning/10 border-warning/30 text-warning",
  CANCELLED: "bg-error/8 border-error/25 text-error",
  EXPIRED: "bg-border/30 border-border text-muted",
};

const PROOF_STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-warning/10 border-warning/30 text-warning",
  APPROVED: "bg-success/8 border-success/25 text-success",
  REJECTED: "bg-error/8 border-error/25 text-error",
  REVOKED: "bg-error/8 border-error/25 text-error",
};

function StatusPill({ value, className }: { value: string; className: string }) {
  const label = value === "PENDING_PAYMENT" ? "Pending Payment" : value.replaceAll("_", " ");
  return <span className={`inline-flex items-center h-4 px-1.5 text-[9px] font-semibold uppercase tracking-wider border ${className}`}>{label}</span>;
}

function SubBadge({ planName, status, proofStatus }: { planName: string; status: string; proofStatus: string | null }) {
  const cls = SUB_STATUS_STYLES[status.toUpperCase()] ?? "bg-border/30 border-border text-muted";
  return (
    <div className="min-w-0">
      <p className="text-small font-medium text-charcoal truncate leading-tight">{planName}</p>
      <div className="mt-1 flex flex-wrap gap-1">
        <StatusPill value={status} className={cls} />
        {proofStatus && <StatusPill value={proofStatus} className={PROOF_STATUS_STYLES[proofStatus] ?? "bg-border/30 border-border text-muted"} />}
      </div>
    </div>
  );
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`bg-surface border border-border animate-pulse ${className}`} />;
}

export default function AdminSubscriptionsPage() {
  const [offset,     setOffset]     = useState(0);
  const [search,     setSearch]     = useState("");
  const [subFilter,  setSubFilter]  = useState<"all" | "subscribed" | "none">("all");

  const { data: orgsData, isLoading } = useOrganizations({ limit: PAGE_SIZE, offset });
  const items: AdminOrganizationResponse[] = orgsData?.items ?? [];

  // The default view includes active subscriptions and pending payment requests.
  const filtered = items.filter(o => {
    const q = search.toLowerCase();
    const matchSearch = !search || (
      o.name.toLowerCase().includes(q) ||
      o.slug.toLowerCase().includes(q) ||
      o.owner.email.toLowerCase().includes(q)
    );
    const matchSub =
      subFilter === "all"        ? true :
      subFilter === "subscribed" ? o.subscription !== null :
      o.subscription === null;
    return matchSearch && matchSub;
  });

  const hasMore = orgsData ? orgsData.items.length === PAGE_SIZE : false;

  const activeStatuses = ["ACTIVE", "TRIALING", "PAST_DUE", "PAUSED"];
  const activeCount = items.filter((o) => !!o.subscription && activeStatuses.includes(o.subscription.status.toUpperCase())).length;
  const pendingPaymentCount = items.filter(o => o.subscription?.status.toUpperCase() === "PENDING_PAYMENT").length;
  const approvedCount = items.filter(o => o.subscription?.proofStatus === "APPROVED").length;
  const cancelledCount = items.filter(o => ["CANCELLED", "EXPIRED"].includes(o.subscription?.status.toUpperCase() ?? "")).length;
  const noPlanCount = items.filter(o => o.subscription === null).length;

  return (
    <AdminPageShell
      title="Subscriptions"
      subtitle="Organization subscription status and plan overview."
      breadcrumbs={[{ label: "Dashboard", href: "/admin/dashboard" }, { label: "Finance" }, { label: "Subscriptions" }]}
    >
      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 2xl:grid-cols-6 gap-3 mb-6">
        <div className="bg-navy p-4">
          <p className="text-caption text-white/50 uppercase tracking-wide mb-1">Active plans</p>
          <p className="font-serif font-bold text-2xl text-gold tabular-nums">
            {isLoading ? "—" : activeCount}
          </p>
        </div>
        <div className="bg-navy p-4">
          <p className="text-caption text-white/50 uppercase tracking-wide mb-1">Pending payment</p>
          <p className="font-serif font-bold text-2xl text-warning tabular-nums">
            {isLoading ? "—" : pendingPaymentCount}
          </p>
        </div>
        <div className="bg-navy p-4">
          <p className="text-caption text-white/50 uppercase tracking-wide mb-1">Approved</p>
          <p className="font-serif font-bold text-2xl text-success tabular-nums">{isLoading ? "—" : approvedCount}</p>
        </div>
        <div className="bg-navy p-4">
          <p className="text-caption text-white/50 uppercase tracking-wide mb-1">Cancelled</p>
          <p className="font-serif font-bold text-2xl text-white/80 tabular-nums">{isLoading ? "—" : cancelledCount}</p>
        </div>
        <div className="bg-navy p-4">
          <p className="text-caption text-white/50 uppercase tracking-wide mb-1">No Plan</p>
          <p className="font-serif font-bold text-2xl text-white tabular-nums">
            {isLoading ? "—" : noPlanCount}
          </p>
        </div>
        <div className="bg-navy p-4">
          <p className="text-caption text-white/50 uppercase tracking-wide mb-1">Total Orgs</p>
          <p className="font-serif font-bold text-2xl text-white tabular-nums">
            {isLoading ? "—" : items.length}
          </p>
        </div>
      </div>

      {pendingPaymentCount > 0 && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border border-warning/30 bg-warning/5 px-4 py-3">
          <p className="text-small text-charcoal">{pendingPaymentCount} organization{pendingPaymentCount === 1 ? " has" : "s have"} a subscription awaiting payment review.</p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none"
            fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text" placeholder="Search organizations…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 bg-surface border border-border text-small text-charcoal placeholder:text-muted focus:outline-none focus:border-navy transition-colors"
          />
        </div>
        <div className="flex gap-1">
          {(["subscribed", "none", "all"] as const).map(f => (
            <button key={f} onClick={() => setSubFilter(f)}
              className={`h-9 px-3 text-caption font-medium transition-colors border ${
                subFilter === f
                  ? "bg-navy text-white border-navy"
                  : "bg-surface text-muted border-border hover:border-navy hover:text-navy"
              }`}>
              {f === "subscribed" ? "Has Subscription" : f === "none" ? "No Plan" : "All"}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16" />)}
        </div>
      )}

      {!isLoading && (
        <>
          <div className="border border-border bg-surface overflow-hidden">
            {/* Column headers */}
            <div className="hidden md:flex items-center px-5 py-2.5 border-b border-border bg-slate/40 gap-4">
              <p className="flex-1 text-caption text-muted uppercase tracking-[0.08em]">Organization</p>
              <p className="w-44 hidden lg:block text-caption text-muted uppercase tracking-[0.08em]">Owner</p>
              <p className="w-44 text-caption text-muted uppercase tracking-[0.08em]">Subscription</p>
              <p className="w-20 text-caption text-muted uppercase tracking-[0.08em]">Status</p>
              <p className="w-32 text-right text-caption text-muted uppercase tracking-[0.08em]">Joined</p>
              <p className="w-28 text-right text-caption text-muted uppercase tracking-[0.08em]">Details</p>
            </div>

            {filtered.length === 0 && (
              <div className="px-5 py-10 text-center">
                <p className="text-small text-muted">
                  {subFilter === "subscribed"
                    ? "No organizations have a subscription request or active plan yet."
                    : search || subFilter !== "all"
                    ? "No organizations match your filters."
                    : "No organizations found."}
                </p>
              </div>
            )}

            {filtered.map(org => (
              <div key={org.id}
                className="flex items-center gap-4 px-5 py-4 border-b border-border/60 last:border-b-0 hover:bg-slate/30 transition-colors">
                {/* Initials */}
                <div className="w-9 h-9 bg-navy flex items-center justify-center shrink-0">
                  <span className="font-serif font-bold text-gold text-caption leading-none">
                    {org.name.slice(0, 2).toUpperCase()}
                  </span>
                </div>

                {/* Name + slug */}
                <div className="flex-1 min-w-0">
                  <p className="text-small font-semibold text-charcoal truncate">{org.name}</p>
                  <p className="text-caption text-muted font-mono truncate">{org.slug}</p>
                </div>

                {/* Owner */}
                <div className="w-44 hidden lg:block min-w-0">
                  <p className="text-small text-charcoal truncate">
                    {org.owner.firstName} {org.owner.lastName}
                  </p>
                  <p className="text-caption text-muted truncate">{org.owner.email}</p>
                </div>

                {/* Subscription */}
                <div className="w-44 shrink-0">
                  {org.subscription
                    ? <SubBadge planName={org.subscription.planName} status={org.subscription.status} proofStatus={org.subscription.proofStatus} />
                    : <span className="text-caption text-muted italic">No plan</span>
                  }
                </div>

                {/* Active status */}
                <div className="w-20 shrink-0">
                  <span className={`inline-flex items-center h-5 px-2 text-[10px] font-semibold uppercase tracking-wider border ${
                    org.isActive
                      ? "bg-success/8 border-success/25 text-success"
                      : "bg-border/30 border-border text-muted"
                  }`}>
                    {org.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                {/* Joined */}
                <div className="w-32 text-right shrink-0">
                  <p className="text-caption text-muted">
                    {new Date(org.createdAt).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
                <div className="w-28 text-right shrink-0">
                  <Link href={`/admin/finance/subscriptions/${org.id}`} className="inline-flex h-9 items-center justify-center rounded bg-navy px-3 text-caption font-semibold text-white hover:bg-navy/90 transition-colors">View details</Link>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-4">
            <p className="text-caption text-muted">
              {filtered.length} organization{filtered.length !== 1 ? "s" : ""}
            </p>
            {!search && subFilter === "all" && (
              <div className="flex items-center gap-2">
                <button onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))} disabled={offset === 0}
                  className="h-8 px-3 text-caption font-medium bg-surface border border-border text-charcoal hover:border-navy disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  ← Prev
                </button>
                <button onClick={() => setOffset(offset + PAGE_SIZE)} disabled={!hasMore}
                  className="h-8 px-3 text-caption font-medium bg-surface border border-border text-charcoal hover:border-navy disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  Next →
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </AdminPageShell>
  );
}
