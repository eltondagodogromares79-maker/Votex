"use client";

import { useState } from "react";
import AdminPageShell from "@/src/features/admin/components/AdminPageShell";
import { useAdminPageants } from "@/src/features/admin/hooks/usePageants";
import type { AdminPageantResponse } from "@/src/types";

const PAGE_SIZE = 50;

const STATUS_STYLES: Record<string, string> = {
  DRAFT:      "bg-border/30 border-border text-muted",
  PUBLISHED:  "bg-navy/8 border-navy/20 text-navy",
  ONGOING:    "bg-success/8 border-success/25 text-success",
  COMPLETED:  "bg-border/30 border-border text-charcoal",
  CANCELLED:  "bg-error/8 border-error/25 text-error",
  ARCHIVED:   "bg-border/30 border-border text-muted",
};

const STATUS_DOT: Record<string, string> = {
  DRAFT:      "bg-border",
  PUBLISHED:  "bg-navy",
  ONGOING:    "bg-success animate-pulse",
  COMPLETED:  "bg-charcoal/40",
  CANCELLED:  "bg-error",
  ARCHIVED:   "bg-border",
};

const ALL_STATUSES = ["DRAFT", "PUBLISHED", "ONGOING", "COMPLETED", "CANCELLED", "ARCHIVED"];

function StatusBadge({ status }: { status: string }) {
  const s = status.toUpperCase();
  const cls = STATUS_STYLES[s] ?? "bg-border/30 border-border text-muted";
  return (
    <span className={`inline-flex items-center gap-1.5 h-5 px-2 text-[10px] font-semibold uppercase tracking-wider border ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[s] ?? "bg-border"}`} />
      {status}
    </span>
  );
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`bg-surface border border-border animate-pulse ${className}`} />;
}

export default function AdminPageantsPage() {
  const [offset,       setOffset]       = useState(0);
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const { data, isLoading, isError } = useAdminPageants({ limit: PAGE_SIZE, offset });
  const items: AdminPageantResponse[] = data?.items ?? [];

  const filtered = items.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !search || (
      p.name.toLowerCase().includes(q) ||
      p.slug.toLowerCase().includes(q) ||
      p.organizationName.toLowerCase().includes(q)
    );
    const matchStatus = !statusFilter || p.status.toUpperCase() === statusFilter;
    return matchSearch && matchStatus;
  });

  const hasMore = data ? data.items.length === PAGE_SIZE : false;

  return (
    <AdminPageShell
      title="Pageants"
      subtitle="All pageants across every organization on the platform."
      breadcrumbs={[{ label: "Dashboard", href: "/admin/dashboard" }, { label: "Pageants" }]}
    >
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none"
            fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text" placeholder="Search by name, slug, or organization…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 bg-surface border border-border text-small text-charcoal placeholder:text-muted focus:outline-none focus:border-navy transition-colors"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setOffset(0); }}
          className="h-9 px-3 bg-surface border border-border text-small text-charcoal focus:outline-none focus:border-navy transition-colors"
        >
          <option value="">All statuses</option>
          {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-14" />)}
        </div>
      )}

      {isError && (
        <div className="bg-error/8 border border-error/20 px-5 py-4">
          <p className="text-small font-semibold text-error">Failed to load pageants.</p>
        </div>
      )}

      {!isLoading && !isError && (
        <>
          <div className="border border-border bg-surface overflow-hidden">
            {/* Column headers */}
            <div className="hidden md:flex items-center px-5 py-2.5 border-b border-border bg-slate/40 gap-4">
              <p className="flex-1 text-caption text-muted uppercase tracking-[0.08em]">Pageant</p>
              <p className="w-40 hidden lg:block text-caption text-muted uppercase tracking-[0.08em]">Organization</p>
              <p className="w-28 text-caption text-muted uppercase tracking-[0.08em]">Status</p>
              <p className="w-20 hidden xl:block text-caption text-muted uppercase tracking-[0.08em]">Visibility</p>
              <p className="w-32 hidden lg:block text-caption text-muted uppercase tracking-[0.08em]">Event Date</p>
              <p className="w-32 text-right text-caption text-muted uppercase tracking-[0.08em]">Created</p>
            </div>

            {filtered.length === 0 && (
              <div className="px-5 py-10 text-center">
                <p className="text-small text-muted">
                  {search || statusFilter ? "No pageants match your filters." : "No pageants found."}
                </p>
              </div>
            )}

            {filtered.map(p => (
              <div key={p.id}
                className="flex items-center gap-4 px-5 py-3.5 border-b border-border/60 last:border-b-0 hover:bg-slate/30 transition-colors">
                {/* Name + slug */}
                <div className="flex-1 min-w-0">
                  <p className="text-small font-semibold text-charcoal truncate">{p.name}</p>
                  <p className="text-caption text-muted font-mono truncate">{p.slug}</p>
                </div>

                {/* Organization */}
                <div className="w-40 hidden lg:block min-w-0">
                  <p className="text-small text-charcoal truncate">{p.organizationName}</p>
                </div>

                {/* Status */}
                <div className="w-28 shrink-0">
                  <StatusBadge status={p.status} />
                </div>

                {/* Visibility */}
                <div className="w-20 hidden xl:block shrink-0">
                  <span className={`inline-flex items-center h-5 px-2 text-[10px] font-semibold uppercase tracking-wider border ${
                    p.isPublic
                      ? "bg-success/8 border-success/25 text-success"
                      : "bg-border/30 border-border text-muted"
                  }`}>
                    {p.isPublic ? "Public" : "Private"}
                  </span>
                </div>

                {/* Event date */}
                <div className="w-32 hidden lg:block shrink-0">
                  <p className="text-caption text-muted">
                    {p.eventDate
                      ? new Date(p.eventDate).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })
                      : <span className="text-border">Not set</span>}
                  </p>
                </div>

                {/* Created */}
                <div className="w-32 text-right shrink-0">
                  <p className="text-caption text-muted">
                    {new Date(p.createdAt).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-caption text-muted">
              {filtered.length} pageant{filtered.length !== 1 ? "s" : ""}
              {(search || statusFilter) ? " matched" : " loaded"}
            </p>
            {!search && !statusFilter && (
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
