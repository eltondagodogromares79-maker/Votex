"use client";

import { useState } from "react";
import CoordinatorPageShell from "@/src/features/coordinator/components/CoordinatorPageShell";
import CoordinatorBadge from "@/src/features/coordinator/components/CoordinatorBadge";
import CoordinatorEmptyState from "@/src/features/coordinator/components/CoordinatorEmptyState";
import CoordinatorDataTable, { CoordTableColumn } from "@/src/features/coordinator/components/CoordinatorDataTable";
import { Button } from "@/src/components/ui/Button";

interface Judge {
  id: string; displayName: string; email: string; judgeCode: string;
  assignedPageants: string[]; scoresSubmitted: number; status: "active"|"inactive";
}

const JUDGES: Judge[] = [
  { id: "1", displayName: "Roberto Cruz",     email: "roberto@example.com", judgeCode: "JDG-001", assignedPageants: ["Miss Universe PH 2026", "Binibining 2026"], scoresSubmitted: 42, status: "active"   },
  { id: "2", displayName: "Sophia Ramos",     email: "sophia@example.com",  judgeCode: "JDG-002", assignedPageants: ["Miss Universe PH 2026"],                    scoresSubmitted: 18, status: "active"   },
  { id: "3", displayName: "Carlo Villanueva", email: "carlo@example.com",   judgeCode: "JDG-003", assignedPageants: ["Campus Royalty 2026"],                     scoresSubmitted: 12, status: "active"   },
  { id: "4", displayName: "Maria Santos",     email: "maria@example.com",   judgeCode: "JDG-004", assignedPageants: ["Binibining 2026"],                          scoresSubmitted: 0,  status: "inactive" },
  { id: "5", displayName: "Jose dela Cruz",   email: "jose@example.com",    judgeCode: "JDG-005", assignedPageants: [],                                            scoresSubmitted: 8,  status: "inactive" },
  { id: "6", displayName: "Karen Bautista",   email: "karen@example.com",   judgeCode: "JDG-006", assignedPageants: ["Miss Universe PH 2026"],                    scoresSubmitted: 25, status: "active"   },
];

const STATUS_BADGE: Record<string, { label: string; variant: "success"|"muted" }> = {
  active:   { label: "Active",   variant: "success" },
  inactive: { label: "Inactive", variant: "muted"   },
};

const COLUMNS: CoordTableColumn<Judge>[] = [
  { 
    key: "judge", 
    header: "Judge", 
    render: (r) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-navy flex items-center justify-center shrink-0">
          <span className="font-serif font-bold text-gold text-caption">{r.displayName.charAt(0)}</span>
        </div>
        <div>
          <p className="font-semibold text-charcoal">{r.displayName}</p>
          <p className="text-caption text-muted">{r.email}</p>
        </div>
      </div>
    ),
  },
  { key: "judgeCode", header: "Code", render: (r) => <span className="font-mono text-caption bg-navy/8 px-2 py-0.5 text-navy font-semibold">{r.judgeCode}</span>, cellClass: "w-28", hideOnMobile: true },
  { key: "assignedPageants", header: "Pageants", render: (r) => r.assignedPageants.length ? <span className="text-small text-charcoal">{r.assignedPageants.join(", ")}</span> : <span className="text-muted">—</span>, hideOnMobile: true },
  { key: "scoresSubmitted", header: "Scores", render: (r) => <span className="tabular-nums font-semibold text-charcoal">{r.scoresSubmitted}</span>, cellClass: "w-20" },
  { key: "status", header: "Status", render: (r) => <CoordinatorBadge variant={STATUS_BADGE[r.status].variant}>{STATUS_BADGE[r.status].label}</CoordinatorBadge>, cellClass: "w-28" },
  { key: "actions", header: "", render: () => (
    <div className="flex justify-end gap-2">
      <Button variant="ghost" size="sm">Edit</Button>
      <Button variant="danger" size="sm">Remove</Button>
    </div>
  ), cellClass: "w-36" },
];

function JudgeIcon() {
  return <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.25} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>;
}

export default function JudgesTeamPage() {
  const [search, setSearch] = useState("");

  const filtered = JUDGES.filter(j =>
    j.displayName.toLowerCase().includes(search.toLowerCase()) ||
    j.email.toLowerCase().includes(search.toLowerCase()) ||
    j.judgeCode.toLowerCase().includes(search.toLowerCase()));

  return (
    <CoordinatorPageShell
      title="Judges"
      subtitle="View and manage all judges across your pageants."
      breadcrumbs={[
        { label: "Dashboard", href: "/coordinator/dashboard" },
        { label: "Teams",     href: "/coordinator/teams"     },
        { label: "Judges" },
      ]}
    >
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: "Total Judges", value: JUDGES.length },
          { label: "Active",       value: JUDGES.filter(j => j.status === "active").length },
          { label: "Total Scores", value: JUDGES.reduce((s, j) => s + j.scoresSubmitted, 0) },
        ].map(s => (
          <div key={s.label} className="bg-surface border border-border px-4 py-3">
            <p className="text-caption text-muted uppercase tracking-[0.1em]">{s.label}</p>
            <p className="font-serif font-bold text-charcoal text-[1.75rem] leading-none">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="relative max-w-xs mb-5">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
        <input type="text" placeholder="Search judges…" value={search} onChange={e => setSearch(e.target.value)}
          className="w-full h-9 pl-9 pr-3 bg-surface border border-border text-small text-charcoal placeholder:text-muted focus:outline-none focus:border-navy transition-colors" />
      </div>

      {filtered.length === 0
        ? <CoordinatorEmptyState icon={<JudgeIcon />} heading="No judges found" description={search ? `No results for "${search}".` : "No judges are assigned to your pageants yet."} />
        : <CoordinatorDataTable columns={COLUMNS} data={filtered} keyExtractor={r => r.id} />
      }
      {filtered.length > 0 && <p className="text-caption text-muted mt-3">Showing {filtered.length} of {JUDGES.length} judges</p>}
    </CoordinatorPageShell>
  );
}