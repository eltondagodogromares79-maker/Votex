"use client";

import { useState } from "react";
import AdminPageShell from "@/src/features/admin/components/AdminPageShell";
import { useOrganizations } from "@/src/features/admin/hooks/useOrganizations";
import type { AdminOrganizationResponse } from "@/src/types";

const PAGE_SIZE = 50;

const SUB_STATUS_STYLES: Record<string, string> = {
  ACTIVE:   "bg-success/8 border-success/25 text-success",
  TRIALING: "bg-gold/10 border-gold/30 text-gold",
  PAST_DUE: "bg-error/8 border-error/25 text-error",
  PAUSED:   "bg-border/30 border-border text-muted",
};

function SubBadge({ planName, status }: { planName: string; status: string }) {
  const cls = SUB_STATUS_STYLES[status.toUpperCase()] ?? "bg-border/30 border-border text-muted";
  return (
    <div>
      <p className="text-small font-medium text-charcoal truncate leading-tight">{planName}</p>
      <span className={`inline-flex items-center h-4 px-1.5 text-[9px] font-semibold uppercase tracking-wider border mt-0.5 ${cls}`}>
        {status}
      </span>
    </div>
  );
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`bg-surface border border-border animate-pulse ${className}`} />;
}

export default function AdminOrganizationsPage() {
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState("");
  const [subFilter, setSubFilter] = useState<"all" | "subscribed" | "none">("all");

  const { data, isLoading, isError } = useOrganizations({ limit: PAGE_SIZE, offset });
  const items: AdminOrganizationResponse[] = data?.items ?? [];

  const filtered = items.filter(o => {
    const q = search.toLowerCase();
    const matchSearch = !search || (
      o.name.toLowerCase().includes(q) ||
      o.slug.toLowerCase().includes(q) ||
      o.owner.email.toLowerCase().includes(q)
    );
    const matchSub =
      subFilter === "all" ? true :
      subFilter === "subscribed" ? o.subscription !== null :
      o.subscription === null;
    return matchSearch && matchSub;
  });

  const hasMore = data ? data.items.length === PAGE_SIZE : false;

  return (
    <AdminPageShell
      title="Organizations"
      subtitle="All registered organizations on the platform."
      breadcrumbs={[{ label: "Dashboard", href: "/admin/dashboard" }, { label: "Organizations" }]}
    >
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none"
            fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text" placeholder="Search by name, slug, or owner email…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 bg-surface border border-border text-small text-charcoal placeholder:text-muted focus:outline-none focus:border-navy transition-colors"
          />
        </div>
        <select
          value={subFilter}
          onChange={e => setSubFilter(e.target.value as "all" | "subscribed" | "none")}
          className="h-9 px-3 bg-surface border border-border text-small text-charcoal focus:outline-none focus:border-navy transition-colors"
        >
          <option value="all">All subscriptions</option>
          <option value="subscribed">Has subscription</option>
          <option value="none">No subscription</option>
        </select>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-16" />)}
        </div>
      )}

      {isError && (
        <div className="bg-error/8 border border-error/20 px-5 py-4">
          <p className="text-small font-semibold text-error">Failed to load organizations.</p>
        </div>
      )}

      {!isLoading && !isError && (
        <>
          <div className="border border-border bg-surface overflow-hidden">
            {/* Column headers */}
            <div className="hidden md:flex items-center px-5 py-2.5 border-b border-border bg-slate/40 gap-4">
              <p className="flex-1 text-caption text-muted uppercase tracking-[0.08em]">Organization</p>
              <p className="w-40 hidden lg:block text-caption text-muted uppercase tracking-[0.08em]">Owner</p>
              <p className="w-40 text-caption text-muted uppercase tracking-[0.08em]">Subscription</p>
              <p className="w-20 text-caption text-muted uppercase tracking-[0.08em]">Status</p>
              <p className="w-32 text-right text-caption text-muted uppercase tracking-[0.08em]">Joined</p>
            </div>

            {filtered.length === 0 && (
              <div className="px-5 py-10 text-center">
                <p className="text-small text-muted">
                  {search || subFilter !== "all" ? "No organizations match your filters." : "No organizations found."}
                </p>
              </div>
            )}

            {filtered.map(org => {
              const initials = org.name.slice(0, 2).toUpperCase();
              return (
                <div key={org.id}
                  className="flex items-center gap-4 px-5 py-4 border-b border-border/60 last:border-b-0 hover:bg-slate/30 transition-colors">
                  {/* Logo / initials */}
                  <div className="w-9 h-9 bg-navy flex items-center justify-center shrink-0">
                    <span className="font-serif font-bold text-gold text-caption leading-none">{initials}</span>
                  </div>

                  {/* Name + slug */}
                  <div className="flex-1 min-w-0">
                    <p className="text-small font-semibold text-charcoal truncate">{org.name}</p>
                    <p className="text-caption text-muted font-mono truncate">{org.slug}</p>
                  </div>

                  {/* Owner */}
                  <div className="w-40 min-w-0 hidden lg:block">
                    <p className="text-small text-charcoal truncate">
                      {org.owner.firstName} {org.owner.lastName}
                    </p>
                    <p className="text-caption text-muted truncate">{org.owner.email}</p>
                  </div>

                  {/* Subscription */}
                  <div className="w-40 shrink-0">
                    {org.subscription
                      ? <SubBadge planName={org.subscription.planName} status={org.subscription.status} />
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
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-caption text-muted">
              {filtered.length} organization{filtered.length !== 1 ? "s" : ""}
              {(search || subFilter !== "all") ? " matched" : " loaded"}
            </p>
            {!search && subFilter === "all" && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                  disabled={offset === 0}
                  className="h-8 px-3 text-caption font-medium bg-surface border border-border text-charcoal hover:border-navy disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  ← Prev
                </button>
                <button
                  onClick={() => setOffset(offset + PAGE_SIZE)}
                  disabled={!hasMore}
                  className="h-8 px-3 text-caption font-medium bg-surface border border-border text-charcoal hover:border-navy disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
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
