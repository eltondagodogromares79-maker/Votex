"use client";

import Link from "next/link";
import OrgPageShell from "@/src/features/org_owner/components/OrgPageShell";
import OrgBadge from "@/src/features/org_owner/components/OrgBadge";
import { useSession } from "@/src/features/auth/context/SessionContext";
import { usePageants } from "@/src/features/org_owner/hooks/usePageants";
import { useVoteRevenue, useTransactions } from "@/src/features/org_owner/hooks/useTransactions";
import type { PageantResponse } from "@/src/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(amount: string, currency: string): string {
  const num = parseFloat(amount);
  if (isNaN(num)) return "—";
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(num);
}

const STATUS_COLORS: Record<string, "success" | "gold" | "navy" | "muted" | "warning"> = {
  live: "success",
  ready: "navy",
  configuring: "gold",
  draft: "muted",
  paused: "warning",
  completed: "muted",
  archived: "muted",
};

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="bg-navy p-5">
      <p className="text-caption text-white/55 uppercase tracking-wide mb-2">{label}</p>
      <p className="font-serif font-bold text-2xl text-gold tabular-nums">{value}</p>
      {sub && <p className="text-caption text-white/40 mt-1.5">{sub}</p>}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`bg-surface border border-border animate-pulse ${className}`} />;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OrgOwnerDashboardPage() {
  const { currentUser } = useSession();
  const orgId = currentUser?.organizationId ?? "";

  const pageants   = usePageants(orgId);
  const revenue    = useVoteRevenue(orgId);
  const txHistory  = useTransactions(orgId, { limit: 5, offset: 0 });

  // ── Derived counts ──────────────────────────────────────────────────────────
  const allPageants   = pageants.data ?? [];
  const livePageants  = allPageants.filter((p: PageantResponse) => p.status === "live");
  const totalPageants = allPageants.length;

  // ── Revenue totals ──────────────────────────────────────────────────────────
  const revenueTotals  = revenue.data?.totalsByCurrency ?? [];
  const totalVotesSold = revenueTotals.reduce((sum, t) => sum + t.votesSold, 0);
  const totalTxCount   = revenueTotals.reduce((sum, t) => sum + t.completedTransactions, 0);

  const revenueDisplay = revenueTotals.length > 0
    ? revenueTotals.map((t) => formatCurrency(t.amount, t.currency)).join(" · ")
    : "₱0.00";

  // ── Recent transactions (5) ─────────────────────────────────────────────────
  const recentTx = txHistory.data?.items.slice(0, 5) ?? [];

  const isLoading = pageants.isLoading || revenue.isLoading;

  return (
    <OrgPageShell
      title="Dashboard"
      subtitle={`Welcome back, ${currentUser?.firstName ?? ""}. Here's your organization overview.`}
    >
      {/* ── Stat cards ─────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Total Pageants"
            value={totalPageants}
            sub={`${livePageants.length} live`}
          />
          <StatCard
            label="Votes Sold"
            value={totalVotesSold.toLocaleString()}
            sub={`${totalTxCount} completed purchases`}
          />
          <StatCard
            label="Voting Revenue"
            value={revenueDisplay}
            sub="Completed vote purchases"
          />
          <StatCard
            label="Live Now"
            value={livePageants.length}
            sub={totalPageants > 0 ? `of ${totalPageants} total` : "No pageants yet"}
          />
        </div>
      )}

      {/* ── Two-column section ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Pageants list */}
        <section className="bg-surface border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif font-bold text-charcoal text-h3">Pageants</h2>
            <Link href="/org_owner/pageants" className="text-caption text-navy hover:underline">
              View all
            </Link>
          </div>

          {pageants.isLoading && <Skeleton className="h-32" />}

          {pageants.isError && (
            <p className="text-small text-error">
              Unable to load pageants.{" "}
              <button onClick={() => pageants.refetch()} className="underline">
                Retry
              </button>
            </p>
          )}

          {!pageants.isLoading && !pageants.isError && allPageants.length === 0 && (
            <p className="text-small text-muted">No pageants yet. Create your first one.</p>
          )}

          {!pageants.isLoading && allPageants.length > 0 && (
            <ul className="space-y-3">
              {allPageants.slice(0, 6).map((p: PageantResponse) => (
                <li key={p.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-small font-semibold text-charcoal truncate">{p.name}</p>
                    {p.eventDate && (
                      <p className="text-caption text-muted">
                        {new Date(p.eventDate).toLocaleDateString("en-PH", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    )}
                  </div>
                  <OrgBadge variant={STATUS_COLORS[p.status] ?? "muted"}>
                    {p.status}
                  </OrgBadge>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Recent vote transactions */}
        <section className="bg-surface border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif font-bold text-charcoal text-h3">Recent Transactions</h2>
            <Link href="/org_owner/billing/transactions" className="text-caption text-navy hover:underline">
              View all
            </Link>
          </div>

          {txHistory.isLoading && <Skeleton className="h-32" />}

          {txHistory.isError && (
            <p className="text-small text-error">
              Unable to load transactions.{" "}
              <button onClick={() => txHistory.refetch()} className="underline">
                Retry
              </button>
            </p>
          )}

          {!txHistory.isLoading && !txHistory.isError && recentTx.length === 0 && (
            <p className="text-small text-muted">No transactions yet.</p>
          )}

          {!txHistory.isLoading && recentTx.length > 0 && (
            <ul className="space-y-3">
              {recentTx.map((tx) => (
                <li key={tx.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-small font-semibold text-charcoal truncate">
                      {tx.description}
                    </p>
                    <p className="text-caption text-muted">
                      {new Date(tx.createdAt).toLocaleDateString("en-PH", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    {tx.amount && tx.currency && (
                      <p className="text-small font-semibold text-charcoal">
                        {formatCurrency(tx.amount, tx.currency)}
                      </p>
                    )}
                    <OrgBadge variant={tx.status === "completed" ? "success" : tx.status === "pending" ? "gold" : "muted"}>
                      {tx.status}
                    </OrgBadge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

      </div>

      {/* ── Revenue by pageant ─────────────────────────────────────────────── */}
      {revenue.data && revenue.data.pageants.length > 0 && (
        <section className="mt-6 bg-surface border border-border p-5">
          <h2 className="font-serif font-bold text-charcoal text-h3 mb-4">
            Revenue by Pageant
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-small">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 pr-6 text-caption font-semibold uppercase tracking-wide text-muted">
                    Pageant
                  </th>
                  <th className="pb-3 pr-6 text-caption font-semibold uppercase tracking-wide text-muted text-right">
                    Revenue
                  </th>
                  <th className="pb-3 pr-6 text-caption font-semibold uppercase tracking-wide text-muted text-right">
                    Votes Sold
                  </th>
                  <th className="pb-3 text-caption font-semibold uppercase tracking-wide text-muted text-right">
                    Transactions
                  </th>
                </tr>
              </thead>
              <tbody>
                {revenue.data.pageants.map((p) => (
                  <tr key={p.pageantId} className="border-b border-border/50 hover:bg-slate/30 transition-colors">
                    <td className="py-3 pr-6 font-medium text-charcoal">{p.pageantName}</td>
                    <td className="py-3 pr-6 text-right tabular-nums text-charcoal">
                      {formatCurrency(p.amount, p.currency)}
                    </td>
                    <td className="py-3 pr-6 text-right tabular-nums text-charcoal">
                      {p.votesSold.toLocaleString()}
                    </td>
                    <td className="py-3 text-right tabular-nums text-charcoal">
                      {p.completedTransactions}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

    </OrgPageShell>
  );
}
