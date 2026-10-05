"use client";

import { use } from "react";
import Link from "next/link";
import CoordinatorPageShell from "@/src/features/coordinator/components/CoordinatorPageShell";
import CoordinatorBadge from "@/src/features/coordinator/components/CoordinatorBadge";
import CoordinatorStatCard from "@/src/features/coordinator/components/CoordinatorStatCard";
import { Button } from "@/src/components/ui/Button";

// ── Placeholder ───────────────────────────────────────────────────────────────
const MOCK: Record<string, {
  name: string; slug: string; status: string; startsAt: string; endsAt: string;
  timezone: string; description: string;
  stats: { label: string; value: number | string; sub: string }[];
}> = {
  "1": {
    name: "Miss Universe Philippines 2026", slug: "miss-universe-ph-2026",
    status: "live", startsAt: "Jun 14, 2026", endsAt: "Jun 16, 2026",
    timezone: "Asia/Manila", description: "The premier pageant of the Philippines, selecting the country's representative to Miss Universe.",
    stats: [
      { label: "Candidates",  value: 32, sub: "Registered" },
      { label: "Judges",      value: 8,  sub: "Assigned"   },
      { label: "Tabulators",  value: 3,  sub: "Active"     },
      { label: "Rounds",      value: 4,  sub: "Defined"    },
    ],
  },
  "2": {
    name: "Binibining Pilipinas 2026", slug: "binibining-2026",
    status: "configuring", startsAt: "Jul 22, 2026", endsAt: "Jul 24, 2026",
    timezone: "Asia/Manila", description: "A multi-title pageant organization celebrating Filipino beauty and talent.",
    stats: [
      { label: "Candidates", value: 25, sub: "Registered" },
      { label: "Judges",     value: 6,  sub: "Assigned"   },
      { label: "Tabulators", value: 2,  sub: "Active"     },
      { label: "Rounds",     value: 3,  sub: "Defined"    },
    ],
  },
  "3": {
    name: "Campus Royalty 2026", slug: "campus-royalty-2026",
    status: "draft", startsAt: "Aug 10, 2026", endsAt: "Aug 10, 2026",
    timezone: "Asia/Manila", description: "A celebration of student excellence and campus leadership.",
    stats: [
      { label: "Candidates", value: 18, sub: "Registered" },
      { label: "Judges",     value: 4,  sub: "Assigned"   },
      { label: "Tabulators", value: 1,  sub: "Active"     },
      { label: "Rounds",     value: 2,  sub: "Defined"    },
    ],
  },
};

const STATUS_BADGE: Record<string, { label: string; variant: "success"|"navy"|"muted"|"gold"|"warning" }> = {
  live:        { label: "Live",        variant: "success" },
  configuring: { label: "Configuring", variant: "gold"    },
  draft:       { label: "Draft",       variant: "muted"   },
  ready:       { label: "Ready",       variant: "navy"    },
  paused:      { label: "Paused",      variant: "warning" },
  completed:   { label: "Completed",   variant: "muted"   },
};

export default function PageantDetailPage({ params }: { params: Promise<{ pageantId: string }> }) {
  const { pageantId } = use(params);
  const pageant = MOCK[pageantId] ?? MOCK["1"];
  const base = `/coordinator/pageants/${pageantId}`;

  const QUICK_LINKS = [
    { label: "Candidates",  href: `${base}/candidates`  },
    { label: "Categories",  href: `${base}/categories`  },
    { label: "Rounds",      href: `${base}/rounds`      },
    { label: "Judges",      href: `${base}/judges`      },
    { label: "Tabulators",  href: `${base}/tabulators`  },
  ];

  return (
    <CoordinatorPageShell
      title={pageant.name}
      subtitle={pageant.description}
      breadcrumbs={[
        { label: "Dashboard", href: "/coordinator/dashboard" },
        { label: "Pageants",  href: "/coordinator/pageants"  },
        { label: pageant.name },
      ]}
      action={
        <div className="flex gap-2">
          <CoordinatorBadge variant={STATUS_BADGE[pageant.status]?.variant ?? "muted"}>
            {STATUS_BADGE[pageant.status]?.label ?? pageant.status}
          </CoordinatorBadge>
          <Button variant="secondary" size="sm">Edit Pageant</Button>
        </div>
      }
    >
      {/* ── Info strip ────────────────────────────────────────────── */}
      <div className="bg-navy overflow-hidden mb-6">
        <div className="px-6 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Start Date", value: pageant.startsAt },
            { label: "End Date",   value: pageant.endsAt   },
            { label: "Timezone",   value: pageant.timezone  },
            { label: "Slug",       value: pageant.slug      },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-caption text-white/40 mb-0.5">{item.label}</p>
              <p className="text-small font-semibold text-white font-mono">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Stats ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {pageant.stats.map((s) => (
          <CoordinatorStatCard key={s.label} label={s.label} value={s.value} sub={s.sub} />
        ))}
      </div>

      {/* ── Quick navigation ──────────────────────────────────────── */}
      <h3 className="font-serif font-semibold text-charcoal text-h3 mb-3">Manage Pageant</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {QUICK_LINKS.map((link) => (
          <Link key={link.href} href={link.href}
            className="bg-surface border border-border px-4 py-5 flex flex-col items-center justify-center gap-2
                       text-center hover:bg-navy hover:border-navy hover:text-white group transition-colors">
            <p className="text-small font-semibold text-charcoal group-hover:text-white transition-colors">
              {link.label}
            </p>
          </Link>
        ))}
      </div>
    </CoordinatorPageShell>
  );
}
