"use client";

import { useState } from "react";
import Link from "next/link";
import CoordinatorPageShell from "@/src/features/coordinator/components/CoordinatorPageShell";
import CoordinatorBadge from "@/src/features/coordinator/components/CoordinatorBadge";
import CoordinatorEmptyState from "@/src/features/coordinator/components/CoordinatorEmptyState";
import { Button } from "@/src/components/ui/Button";

type PageantStatus = "draft"|"configuring"|"ready"|"live"|"paused"|"completed"|"archived";

interface Pageant {
  id: string; name: string; slug: string; status: PageantStatus;
  startsAt: string; candidates: number; judges: number; tabulators: number; rounds: number;
}

const PAGEANTS: Pageant[] = [
  { id: "1", name: "Miss Universe Philippines 2026",  slug: "miss-universe-ph-2026",  status: "live",        startsAt: "Jun 14, 2026", candidates: 32, judges: 8, tabulators: 3, rounds: 4 },
  { id: "2", name: "Binibining Pilipinas 2026",        slug: "binibining-2026",         status: "configuring", startsAt: "Jul 22, 2026", candidates: 25, judges: 6, tabulators: 2, rounds: 3 },
  { id: "3", name: "Campus Royalty 2026",              slug: "campus-royalty-2026",     status: "draft",       startsAt: "Aug 10, 2026", candidates: 18, judges: 4, tabulators: 1, rounds: 2 },
];

const STATUS_BADGE: Record<PageantStatus, { label: string; variant: "success"|"navy"|"muted"|"gold"|"warning"|"error" }> = {
  draft:       { label: "Draft",       variant: "muted"    },
  configuring: { label: "Configuring", variant: "gold"     },
  ready:       { label: "Ready",       variant: "navy"     },
  live:        { label: "Live",        variant: "success"  },
  paused:      { label: "Paused",      variant: "warning"  },
  completed:   { label: "Completed",   variant: "muted"    },
  archived:    { label: "Archived",    variant: "muted"    },
};

const ALL_STATUSES: PageantStatus[] = ["draft","configuring","ready","live","paused","completed","archived"];

function PageantIcon() {
  return <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.25} viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>;
}

export default function CoordinatorPageantsPage() {
  const [filter, setFilter] = useState<PageantStatus|"all">("all");
  const [search, setSearch] = useState("");

  const filtered = PAGEANTS.filter((p) => {
    const matchStatus = filter === "all" || p.status === filter;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <CoordinatorPageShell
      title="Pageants"
      subtitle="Create and manage all your assigned pageant events."
      breadcrumbs={[{ label: "Dashboard", href: "/coordinator/dashboard" }, { label: "Pageants" }]}
    >
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input type="text" placeholder="Search pageants…" value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 bg-surface border border-border text-small text-charcoal placeholder:text-muted focus:outline-none focus:border-navy transition-colors" />
        </div>
        <div className="flex gap-1 overflow-x-auto">
          {(["all", ...ALL_STATUSES] as const).map((s) => (
            <button key={s} type="button" onClick={() => setFilter(s)}
              className={`shrink-0 h-9 px-3 text-caption font-medium transition-colors border
                ${filter === s ? "bg-navy text-white border-navy" : "bg-surface text-muted border-border hover:border-navy hover:text-navy"}`}>
              {s === "all" ? "All" : STATUS_BADGE[s]?.label ?? s}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <CoordinatorEmptyState icon={<PageantIcon />} heading="No pageants found"
          description={search ? `No results for "${search}".` : "No pageants have been assigned to you yet."} />
      ) : (
        <div className="border border-border bg-surface overflow-hidden">
          {filtered.map((p) => (
            <Link key={p.id} href={`/coordinator/pageants/${p.id}`}
              className="flex items-center gap-4 px-5 py-4 hover:bg-slate/40 transition-colors group border-b border-border/60 last:border-b-0">
              <div className={`w-2 h-2 shrink-0 rounded-full ${
                p.status === "live" ? "bg-success animate-pulse" :
                p.status === "configuring" ? "bg-gold" : "bg-border"}`} />
              <div className="flex-1 min-w-0">
                <p className="text-small font-semibold text-charcoal group-hover:text-navy truncate transition-colors">{p.name}</p>
                <p className="text-caption text-muted mt-0.5 font-mono">{p.slug}</p>
                <p className="text-caption text-muted mt-0.5 hidden sm:block">
                  {p.startsAt} · {p.candidates} candidates · {p.judges} judges · {p.tabulators} tabulators · {p.rounds} rounds
                </p>
              </div>
              <CoordinatorBadge variant={STATUS_BADGE[p.status]?.variant ?? "muted"}>
                {STATUS_BADGE[p.status]?.label ?? p.status}
              </CoordinatorBadge>
              <svg className="w-4 h-4 text-border group-hover:text-muted shrink-0 transition-colors" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          ))}
        </div>
      )}
      {filtered.length > 0 && (
        <p className="text-caption text-muted mt-3">Showing {filtered.length} of {PAGEANTS.length} pageants</p>
      )}
    </CoordinatorPageShell>
  );
}
