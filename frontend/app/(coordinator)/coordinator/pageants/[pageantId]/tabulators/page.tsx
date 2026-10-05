"use client";

import { useState, use } from "react";
import CoordinatorPageShell from "@/src/features/coordinator/components/CoordinatorPageShell";
import CoordinatorBadge from "@/src/features/coordinator/components/CoordinatorBadge";
import CoordinatorEmptyState from "@/src/features/coordinator/components/CoordinatorEmptyState";
import CoordinatorDataTable, { CoordTableColumn } from "@/src/features/coordinator/components/CoordinatorDataTable";
import { Button } from "@/src/components/ui/Button";

interface Tabulator {
  id: string; displayName: string; email: string; tabulatorCode: string;
  roundsHandled: number; status: "active"|"inactive"; lastActivity: string;
}

const TABULATORS: Tabulator[] = [
  { id: "1", displayName: "Ana Reyes",      email: "ana@example.com",    tabulatorCode: "TAB-001", roundsHandled: 3, status: "active",   lastActivity: "2 hours ago"  },
  { id: "2", displayName: "Ben Torres",     email: "ben@example.com",    tabulatorCode: "TAB-002", roundsHandled: 2, status: "active",   lastActivity: "1 day ago"    },
  { id: "3", displayName: "Carla Mendoza",  email: "carla@example.com",  tabulatorCode: "TAB-003", roundsHandled: 0, status: "inactive", lastActivity: "1 week ago"   },
];

const STATUS_BADGE: Record<string, { label: string; variant: "success"|"muted" }> = {
  active:   { label: "Active",   variant: "success" },
  inactive: { label: "Inactive", variant: "muted"   },
};

const fieldLabel = "block text-small font-medium text-charcoal mb-1.5";
const fieldInput  = "w-full h-10 px-3 bg-surface border border-border text-small text-charcoal placeholder:text-muted focus:outline-none focus:border-navy transition-colors";

const COLUMNS: CoordTableColumn<Tabulator>[] = [
  { 
    key: "tabulator", 
    header: "Tabulator", 
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
  { key: "tabulatorCode", header: "Code", render: (r) => <span className="font-mono text-caption bg-navy/8 px-2 py-0.5 text-navy font-semibold">{r.tabulatorCode}</span>, cellClass: "w-28", hideOnMobile: true },
  { key: "roundsHandled", header: "Rounds", render: (r) => <span className="tabular-nums font-semibold text-charcoal">{r.roundsHandled}</span>, cellClass: "w-20" },
  { key: "lastActivity", header: "Last Active", render: (r) => <span className="text-caption text-muted">{r.lastActivity}</span>, hideOnMobile: true },
  { key: "status", header: "Status", render: (r) => <CoordinatorBadge variant={STATUS_BADGE[r.status].variant}>{STATUS_BADGE[r.status].label}</CoordinatorBadge>, cellClass: "w-28" },
  { key: "actions", header: "", render: () => (
    <div className="flex justify-end gap-2">
      <Button variant="ghost" size="sm">Edit</Button>
      <Button variant="danger" size="sm">Remove</Button>
    </div>
  ), cellClass: "w-36" },
];

function AssignPanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="mb-5 bg-surface border border-border overflow-hidden">
      <div className="bg-navy px-5 py-3.5 flex items-center justify-between">
        <p className="font-serif font-semibold text-white text-h3">Assign Tabulator</p>
        <button type="button" onClick={onClose} className="text-white/40 hover:text-white transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
      <div className="px-5 py-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><label className={fieldLabel}>Select Tabulator <span className="text-error">*</span></label>
          <select className={fieldInput + " bg-surface"}>
            <option value="">Choose an existing tabulator…</option>
            <option>Ana Reyes (TAB-001)</option>
            <option>Ben Torres (TAB-002)</option>
            <option>Carla Mendoza (TAB-003)</option>
          </select></div>
        <div><label className={fieldLabel}>Access Level</label>
          <select className={fieldInput + " bg-surface"}>
            <option>View Only</option>
            <option>Monitor Scores</option>
            <option>Full Access</option>
          </select></div>
      </div>
      <div className="px-5 pb-5 flex gap-3">
        <Button variant="secondary" size="sm">Assign Tabulator</Button>
        <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
      </div>
    </div>
  );
}

export default function TabulatorsPage({ params }: { params: Promise<{ pageantId: string }> }) {
  const { pageantId } = use(params);
  const [search, setSearch] = useState("");
  const [showAssign, setShowAssign] = useState(false);

  const filtered = TABULATORS.filter(t =>
    t.displayName.toLowerCase().includes(search.toLowerCase()) ||
    t.email.toLowerCase().includes(search.toLowerCase()) ||
    t.tabulatorCode.toLowerCase().includes(search.toLowerCase()));

  return (
    <CoordinatorPageShell
      title="Tabulators"
      subtitle="Manage tabulators who monitor scoring for this pageant."
      breadcrumbs={[
        { label: "Dashboard", href: "/coordinator/dashboard" },
        { label: "Pageants",  href: "/coordinator/pageants"  },
        { label: "Tabulators" },
      ]}
      action={<Button variant="secondary" size="sm" onClick={() => setShowAssign(!showAssign)}>+ Assign Tabulator</Button>}
    >
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: "Total",          value: TABULATORS.length },
          { label: "Active",         value: TABULATORS.filter(t => t.status === "active").length },
          { label: "Rounds Handled", value: TABULATORS.reduce((s, t) => s + t.roundsHandled, 0) },
        ].map(s => (
          <div key={s.label} className="bg-surface border border-border px-4 py-3">
            <p className="text-caption text-muted uppercase tracking-[0.1em]">{s.label}</p>
            <p className="font-serif font-bold text-charcoal text-[1.75rem] leading-none">{s.value}</p>
          </div>
        ))}
      </div>

      {showAssign && <AssignPanel onClose={() => setShowAssign(false)} />}

      <div className="relative max-w-xs mb-5">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
        <input type="text" placeholder="Search tabulators…" value={search} onChange={e => setSearch(e.target.value)}
          className="w-full h-9 pl-9 pr-3 bg-surface border border-border text-small text-charcoal placeholder:text-muted focus:outline-none focus:border-navy transition-colors" />
      </div>

      {filtered.length === 0
        ? <CoordinatorEmptyState heading="No tabulators found" description={search ? `No results for "${search}".` : "Assign tabulators to monitor live scoring for this pageant."} action={!search ? <Button variant="secondary" size="sm" onClick={() => setShowAssign(true)}>+ Assign Tabulator</Button> : undefined} />
        : <CoordinatorDataTable columns={COLUMNS} data={filtered} keyExtractor={r => r.id} />
      }
      {filtered.length > 0 && <p className="text-caption text-muted mt-3">Showing {filtered.length} of {TABULATORS.length} tabulators</p>}
    </CoordinatorPageShell>
  );
}