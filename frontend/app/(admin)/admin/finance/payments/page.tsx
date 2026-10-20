"use client";

import { useState } from "react";
import Link from "next/link";
import AdminPageShell from "@/src/features/admin/components/AdminPageShell";
import { useTransactionLogs } from "@/src/features/admin/hooks/useAuditLogs";

const PAGE_SIZE = 50;

function StatusBadge({ status }: { status: string }) {
  const s = status.toUpperCase();
  const cls =
    s === "COMPLETED" ? "bg-success/8 border-success/25 text-success" :
    s === "PENDING"   ? "bg-gold/10 border-gold/30 text-gold" :
    s === "FAILED"    ? "bg-error/8 border-error/25 text-error" :
    "bg-border/30 border-border text-muted";
  return <span className={`inline-flex items-center h-5 px-2 text-[10px] font-semibold uppercase tracking-wider border ${cls}`}>{status}</span>;
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`bg-surface border border-border animate-pulse ${className}`} />;
}

export default function AdminPaymentsPage() {
  const [offset, setOffset] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");

  const query: Record<string, unknown> = { limit: PAGE_SIZE, offset };
  if (statusFilter) query.status = statusFilter;

  const { data, isLoading, isError } = useTransactionLogs(query);
  const items = data?.items ?? [];
  const hasMore = items.length === PAGE_SIZE;

  return (
    <AdminPageShell
      title="Transactions"
      subtitle="Review subscription billing and payment transactions across organizations."
      breadcrumbs={[{ label: "Dashboard", href: "/admin/dashboard" }, { label: "Finance" }, { label: "Transactions" }]}
    >
      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setOffset(0); }}
          className="h-9 px-3 bg-surface border border-border text-small text-charcoal focus:outline-none focus:border-navy transition-colors"
        >
          <option value="">All statuses</option>
          {["COMPLETED","PENDING","FAILED","REFUNDED","CANCELLED"].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {isLoading && (
        <div className="space-y-2">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
      )}

      {isError && (
        <div className="bg-error/8 border border-error/20 px-5 py-4">
          <p className="text-small font-semibold text-error">Failed to load transactions.</p>
        </div>
      )}

      {!isLoading && !isError && (
        <>
          <div className="border border-border bg-surface overflow-hidden">
            <div className="hidden md:flex items-center px-5 py-2.5 border-b border-border bg-slate/40 gap-4">
              <p className="flex-1 text-caption text-muted uppercase tracking-[0.08em]">Transaction</p>
              <p className="w-32 hidden lg:block text-caption text-muted uppercase tracking-[0.08em]">Organization</p>
              <p className="w-24 text-caption text-muted uppercase tracking-[0.08em]">Status</p>
              <p className="w-32 text-right text-caption text-muted uppercase tracking-[0.08em]">Amount</p>
              <p className="w-32 text-right text-caption text-muted uppercase tracking-[0.08em]">Date</p>
              <p className="w-48 text-right text-caption text-muted uppercase tracking-[0.08em]">Details</p>
            </div>

            {items.length === 0 && (
              <div className="px-5 py-10 text-center">
                <p className="text-small text-muted">No transactions found.</p>
              </div>
            )}

            {items.map(tx => (
              <div key={tx.id}
                className="flex items-center gap-4 px-5 py-3.5 border-b border-border/60 last:border-b-0 hover:bg-slate/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-small font-semibold text-charcoal truncate">
                    {tx.transactionType.replace(/_/g, " ")}
                  </p>
                  <p className="text-caption text-muted font-mono truncate">{tx.id.slice(0, 8)}…</p>
                </div>
                <div className="w-32 hidden lg:block min-w-0">
                  <p className="text-small text-charcoal truncate">{tx.organizationName ?? "—"}</p>
                </div>
                <div className="w-24 shrink-0">
                  <StatusBadge status={tx.status} />
                </div>
                <div className="w-32 text-right shrink-0">
                  {tx.amount
                    ? <p className="text-small font-semibold text-charcoal tabular-nums">
                        {tx.currency} {parseFloat(tx.amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                      </p>
                    : <p className="text-caption text-muted">—</p>
                  }
                </div>
                <div className="w-48 shrink-0 text-right">
                  {tx.organizationId ? (
                    <Link
                      href={`/admin/finance/subscriptions/${tx.organizationId}`}
                      className="inline-flex h-9 items-center justify-center rounded bg-navy px-3 text-caption font-semibold text-white hover:bg-navy/90 transition-colors"
                    >
                      View transaction details
                    </Link>
                  ) : (
                    <span className="text-caption text-muted">No organization details</span>
                  )}
                </div>
                <div className="w-32 text-right shrink-0">
                  <p className="text-caption text-muted">
                    {new Date(tx.createdAt).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-4">
            <p className="text-caption text-muted">{items.length} transaction{items.length !== 1 ? "s" : ""} loaded</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))} disabled={offset === 0}
                className="h-8 px-3 text-caption font-medium bg-surface border border-border text-charcoal hover:border-navy disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                ← Prev
              </button>
              <button onClick={() => setOffset(offset + PAGE_SIZE)} disabled={!hasMore}
                className="h-8 px-3 text-caption font-medium bg-surface border border-border text-charcoal hover:border-navy disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                Next →
              </button>
            </div>
          </div>
        </>
      )}
    </AdminPageShell>
  );
}
