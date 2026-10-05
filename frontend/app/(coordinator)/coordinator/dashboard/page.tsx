"use client";

import Link from "next/link";
import CoordinatorPageShell from "@/src/features/coordinator/components/CoordinatorPageShell";
import CoordinatorStatCard from "@/src/features/coordinator/components/CoordinatorStatCard";
import CoordinatorBadge from "@/src/features/coordinator/components/CoordinatorBadge";
import { Button } from "@/src/components/ui/Button";

// ── Placeholder data ──────────────────────────────────────────────────────────
const MY_PAGEANTS = [
  { id: "1", name: "Miss Universe Philippines 2026", status: "live",        startsAt: "Jun 14, 2026", candidates: 32, rounds: 4 },
  { id: "2", name: "Binibining Pilipinas 2026",       status: "configuring", startsAt: "Jul 22, 2026", candidates: 25, rounds: 3 },
  { id: "3", name: "Campus Royalty 2026",             status: "draft",       startsAt: "Aug 10, 2026", candidates: 18, rounds: 2 },
];

const RECENT_ACTIVITY = [
  { id: "1", text: "Round 1 scoring completed for Miss Universe PH",   time: "1 hour ago"  },
  { id: "2", text: "Judge Roberto Cruz submitted all scores",           time: "3 hours ago" },
  { id: "3", text: "Candidate #7 Ana Reyes status updated to Active",  time: "Yesterday"   },
  { id: "4", text: "New round 'Swimwear' added to Binibining",         time: "2 days ago"  },
];

const STATUS_BADGE: Record<string, { label: string; variant: "success"|"navy"|"muted"|"gold"|"warning" }> = {
  live:        { label: "Live",        variant: "success" },
  configuring: { label: "Configuring", variant: "gold"    },
  draft:       { label: "Draft",       variant: "muted"   },
  ready:       { label: "Ready",       variant: "navy"    },
  paused:      { label: "Paused",      variant: "warning" },
  completed:   { label: "Completed",   variant: "muted"   },
};

function IconPageant() {
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>;
}
function IconLive() {
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>;
}
function IconTeam() {
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>;
}
function IconScore() {
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>;
}

export default function CoordinatorDashboard() {
  return (
    <CoordinatorPageShell
      title="Dashboard"
      subtitle="Welcome back. Here's what's happening with your assigned pageants."
      action={
        <Link href="/coordinator/pageants">
          <Button variant="secondary" size="sm">View Pageants</Button>
        </Link>
      }
    >
      {/* ── Row 1 — highlighted cards ─────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <CoordinatorStatCard
          label="My Pageants"
          value={MY_PAGEANTS.length}
          sub="Assigned to me"
          icon={<IconPageant />}
          dark
        />
        <CoordinatorStatCard
          label="Live Now"
          value={MY_PAGEANTS.filter(p => p.status === "live").length}
          sub="Currently active"
          icon={<IconLive />}
          dark
          trend="up"
          trendLabel="Active"
        />
      </div>

      {/* ── Row 2 — supporting cards ──────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <CoordinatorStatCard
          label="Total Candidates"
          value={MY_PAGEANTS.reduce((s, p) => s + p.candidates, 0)}
          sub="Across all pageants"
          icon={<IconTeam />}
        />
        <CoordinatorStatCard
          label="Scoring Rounds"
          value={MY_PAGEANTS.reduce((s, p) => s + p.rounds, 0)}
          sub="Total rounds defined"
          icon={<IconScore />}
        />
      </div>

      {/* ── Two-column grid ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Pageant list — 2 cols */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-caption font-semibold uppercase tracking-[0.12em] text-gold mb-0.5">My Events</p>
              <h3 className="font-serif font-bold text-charcoal text-h3">Assigned Pageants</h3>
            </div>
            <Link href="/coordinator/pageants" className="text-caption text-muted hover:text-navy transition-colors font-medium">
              View all →
            </Link>
          </div>

          <div className="border border-border bg-surface overflow-hidden">
            {MY_PAGEANTS.map((p) => (
              <Link key={p.id} href={`/coordinator/pageants/${p.id}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-slate/40 transition-colors group border-b border-border/60 last:border-b-0">
                <div className={`w-2 h-2 shrink-0 rounded-full ${
                  p.status === "live" ? "bg-success animate-pulse" :
                  p.status === "configuring" ? "bg-gold" : "bg-border"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-small font-semibold text-charcoal group-hover:text-navy truncate transition-colors">{p.name}</p>
                  <p className="text-caption text-muted mt-0.5">{p.startsAt} · {p.candidates} candidates · {p.rounds} rounds</p>
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
        </div>

        {/* Activity + quick links — 1 col */}
        <div>
          <div className="mb-4">
            <p className="text-caption font-semibold uppercase tracking-[0.12em] text-gold mb-0.5">Activity</p>
            <h3 className="font-serif font-bold text-charcoal text-h3">Recent actions</h3>
          </div>

          <div className="border border-border bg-surface">
            {RECENT_ACTIVITY.map((item) => (
              <div key={item.id} className="flex gap-3 px-4 py-3.5 border-b border-border/60 last:border-b-0">
                <div className="mt-1.5 w-1.5 h-1.5 shrink-0 bg-gold/60 rounded-full" />
                <div>
                  <p className="text-small text-charcoal leading-snug">{item.text}</p>
                  <p className="text-caption text-muted mt-1">{item.time}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {[
              { label: "Judges",     href: "/coordinator/teams/judges"     },
              { label: "Tabulators", href: "/coordinator/teams/tabulators" },
              { label: "Candidates", href: "/coordinator/pageants"         },
              { label: "Rounds",     href: "/coordinator/pageants"         },
            ].map((link) => (
              <Link key={link.label} href={link.href}
                className="flex items-center justify-center py-2.5 px-3 text-caption font-medium
                           text-charcoal bg-surface border border-border
                           hover:bg-navy hover:text-white hover:border-navy transition-colors">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </CoordinatorPageShell>
  );
}
