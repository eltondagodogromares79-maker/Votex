"use client";

import { useState } from "react";
import CoordinatorPageShell from "@/src/features/coordinator/components/CoordinatorPageShell";
import CoordinatorBadge from "@/src/features/coordinator/components/CoordinatorBadge";
import CoordinatorEmptyState from "@/src/features/coordinator/components/CoordinatorEmptyState";
import CoordinatorDataTable, { CoordTableColumn } from "@/src/features/coordinator/components/CoordinatorDataTable";
import { Button } from "@/src/components/ui/Button";

interface OrgOwner {
  id: string; displayName: string; email: string; organizationName: string;
  pageantCount: number; status: "active"|"inactive"; joinedAt: string;
}

const ORG_OWNERS: OrgOwner[] = [
  { id: "1", displayName: "Juan dela Cruz", email: "juan@votexdemo.com",    organizationName: "Votex Demo Organization", pageantCount: 3, status: "active",   joinedAt: "Jan 1, 2026"  },
  { id: "2", displayName: "Lisa Santos",    email: "lisa@beautyph.com",    organizationName: "Beauty Philippines Inc",  pageantCount: 2, status: "active",   joinedAt: "Feb 15, 2026" },
];

const STATUS_BADGE: Record<string, { label: string; variant: "success"|"muted" }> = {
  active:   { label: "Active",   variant: "success" },
  inactive: { label: "Inactive", variant: "muted"   },
};

const COLUMNS: CoordTableColumn<OrgOwner>[] = [
  { 
    key: "owner", 
    header: "Organization Owner", 
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
  { key: "organizationName", header: "Organization", render: (r) => <span className="text-small text-charcoal">{r.organizationName}</span>, hideOnMobile: true },
  { key: "pageantCount", header: "Pageants", render: (r) => <span className="tabular-nums font-semibold text-charcoal">{r.pageantCount}</span>, cellClass: "w-24" },
  { key: "status", header: "Status", render: (r) => <CoordinatorBadge variant={STATUS_BADGE[r.status].variant}>{STATUS_BADGE[r.status].label}</CoordinatorBadge>, cellClass: "w-28" },
  { key: "joinedAt", header: "Joined", render: (r) => <span className="text-caption text-muted">{r.joinedAt}</span>, hideOnMobile: true },
  { key: "actions", header: "", render: () => (
    <div className="flex justify-end gap-2">
      <Button variant="ghost" size="sm">View</Button>
    </div>
  ), cellClass: "w-24" },
];

function OrgOwnerIcon() {
  return <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.25} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m0-18H21l-1.5 1.5M3.75 3l1.5-1.5M12 3v18" /></svg>;
}

export default function OrgOwnersTeamPage() {
  const [search, setSearch] = useState("");

  const filtered = ORG_OWNERS.filter(o =>
    o.displayName.toLowerCase().includes(search.toLowerCase()) ||
    o.email.toLowerCase().includes(search.toLowerCase()) ||
    o.organizationName.toLowerCase().includes(search.toLowerCase()));

  return (
    <CoordinatorPageShell
      title="Organization Owners"
      subtitle="View the organization owners who assign pageants to you."
      breadcrumbs={[
        { label: "Dashboard", href: "/coordinator/dashboard" },
        { label: "Teams",     href: "/coordinator/teams"     },
        { label: "Org Owners" },
      ]}
    >
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: "Organizations", value: ORG_OWNERS.length },
          { label: "Active",        value: ORG_OWNERS.filter(o => o.status === "active").length },
          { label: "Total Pageants", value: ORG_OWNERS.reduce((s, o) => s + o.pageantCount, 0) },
        ].map(s => (
          <div key={s.label} className="bg-surface border border-border px-4 py-3">
            <p className="text-caption text-muted uppercase tracking-[0.1em]">{s.label}</p>
            <p className="font-serif font-bold text-charcoal text-[1.75rem] leading-none">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="relative max-w-xs mb-5">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
        <input type="text" placeholder="Search organizations…" value={search} onChange={e => setSearch(e.target.value)}
          className="w-full h-9 pl-9 pr-3 bg-surface border border-border text-small text-charcoal placeholder:text-muted focus:outline-none focus:border-navy transition-colors" />
      </div>

      {filtered.length === 0
        ? <CoordinatorEmptyState icon={<OrgOwnerIcon />} heading="No organizations found" description={search ? `No results for "${search}".` : "No organizations are working with you yet."} />
        : <CoordinatorDataTable columns={COLUMNS} data={filtered} keyExtractor={r => r.id} />
      }
      {filtered.length > 0 && <p className="text-caption text-muted mt-3">Showing {filtered.length} of {ORG_OWNERS.length} organizations</p>}
    </CoordinatorPageShell>
  );
}