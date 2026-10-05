"use client";

import Link from "next/link";
import CoordinatorPageShell from "@/src/features/coordinator/components/CoordinatorPageShell";
import CoordinatorStatCard from "@/src/features/coordinator/components/CoordinatorStatCard";

const TEAM_STATS = [
  { category: "Tabulators", count: 3, active: 2, href: "/coordinator/teams/tabulators" },
  { category: "Judges",     count: 8, active: 6, href: "/coordinator/teams/judges"     },
  { category: "Org Owners", count: 2, active: 2, href: "/coordinator/teams/org-owners" },
];

function IconTabulator() {
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75.125V5.625m0 12.75v-1.5m0 0a1.125 1.125 0 011.125-1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125m1.125-1.125V5.625m0 12.75h13.5m0-12.75h-13.5" /></svg>;
}
function IconJudge() {
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>;
}
function IconOrgOwner() {
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m0-18H21l-1.5 1.5M3.75 3l1.5-1.5M12 3v18" /></svg>;
}

const ICONS = {
  Tabulators: <IconTabulator />,
  Judges: <IconJudge />,
  "Org Owners": <IconOrgOwner />,
};

export default function CoordinatorTeamsPage() {
  return (
    <CoordinatorPageShell
      title="Teams"
      subtitle="Manage team members across all your assigned pageants."
      breadcrumbs={[
        { label: "Dashboard", href: "/coordinator/dashboard" },
        { label: "Teams" },
      ]}
    >
      {/* Overview stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <CoordinatorStatCard
          label="Total Members"
          value={TEAM_STATS.reduce((s, t) => s + t.count, 0)}
          sub="Across all roles"
          dark
        />
        <CoordinatorStatCard
          label="Active Now"
          value={TEAM_STATS.reduce((s, t) => s + t.active, 0)}
          sub="Currently online"
          dark
        />
        <CoordinatorStatCard
          label="Team Categories"
          value={TEAM_STATS.length}
          sub="Different roles"
          dark
        />
      </div>

      {/* Team categories */}
      <h3 className="font-serif font-semibold text-charcoal text-h3 mb-4">Team Categories</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {TEAM_STATS.map((team) => (
          <Link key={team.category} href={team.href}
            className="bg-surface border border-border overflow-hidden hover:border-navy transition-colors group">
            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-navy/6 text-navy flex items-center justify-center group-hover:bg-navy group-hover:text-white transition-colors">
                  {ICONS[team.category as keyof typeof ICONS]}
                </div>
                <div className="text-right">
                  <p className="font-serif font-bold text-charcoal text-[1.5rem] leading-none">{team.count}</p>
                  <p className="text-caption text-muted">Total</p>
                </div>
              </div>
              <p className="font-semibold text-charcoal group-hover:text-navy transition-colors mb-1">{team.category}</p>
              <p className="text-caption text-muted">{team.active} active members</p>
            </div>
          </Link>
        ))}
      </div>
    </CoordinatorPageShell>
  );
}