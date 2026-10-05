"use client";

import { useState } from "react";
import OrgPageShell from "@/src/features/org_owner/components/OrgPageShell";
import OrgBadge from "@/src/features/org_owner/components/OrgBadge";
import { Button } from "@/src/components/ui/Button";

// ─────────────────────────────────────────────────────────────────────────────
type TxType   = "subscription" | "vote_package" | "refund";
type TxStatus = "paid" | "pending" | "failed" | "refunded";

interface Transaction {
  id: string;
  date: string;
  description: string;
  type: TxType;
  amount: string;
  status: TxStatus;
  ref: string;
  paymentMethod: string;
}

const TRANSACTIONS: Transaction[] = [
  { id:  "1", date: "Jun 14, 2026", description: "Pro Plan — Monthly",              type: "subscription",  amount: "₱2,500.00", status: "paid",     ref: "PAY-20260614", paymentMethod: "GCash"       },
  { id:  "2", date: "Jun 10, 2026", description: "Vote Package — 500 votes",        type: "vote_package",  amount: "₱1,500.00", status: "paid",     ref: "PAY-20260610", paymentMethod: "Maya"        },
  { id:  "3", date: "Jun 8, 2026",  description: "Vote Package — 200 votes",        type: "vote_package",  amount: "₱600.00",   status: "paid",     ref: "PAY-20260608", paymentMethod: "Credit Card" },
  { id:  "4", date: "May 14, 2026", description: "Pro Plan — Monthly",              type: "subscription",  amount: "₱2,500.00", status: "paid",     ref: "PAY-20260514", paymentMethod: "GCash"       },
  { id:  "5", date: "May 3, 2026",  description: "Vote Package — 100 votes",        type: "vote_package",  amount: "₱300.00",   status: "refunded", ref: "PAY-20260503", paymentMethod: "GCash"       },
  { id:  "6", date: "Apr 14, 2026", description: "Pro Plan — Monthly",              type: "subscription",  amount: "₱2,500.00", status: "paid",     ref: "PAY-20260414", paymentMethod: "GCash"       },
  { id:  "7", date: "Apr 14, 2026", description: "Refund — Vote Package 100 votes", type: "refund",        amount: "−₱300.00",  status: "refunded", ref: "REF-20260414", paymentMethod: "GCash"       },
  { id:  "8", date: "Mar 14, 2026", description: "Basic Plan — Monthly",            type: "subscription",  amount: "₱1,200.00", status: "paid",     ref: "PAY-20260314", paymentMethod: "Bank Transfer"},
];

const STATUS_BADGE: Record<TxStatus, { label: string; variant: "success"|"warning"|"error"|"muted" }> = {
  paid:     { label: "Paid",     variant: "success" },
  pending:  { label: "Pending",  variant: "warning" },
  failed:   { label: "Failed",   variant: "error"   },
  refunded: { label: "Refunded", variant: "muted"   },
};

const TYPE_LABEL: Record<TxType, string> = {
  subscription: "Subscription",
  vote_package: "Vote Package",
  refund:       "Refund",
};

type FilterStatus = TxStatus | "all";

const SUMMARY = {
  totalPaid:    TRANSACTIONS.filter((t) => t.status === "paid").reduce((s, t) => s + parseFloat(t.amount.replace(/[₱,−]/g, "")), 0),
  totalRefunded: TRANSACTIONS.filter((t) => t.status === "refunded" && t.type !== "refund").length,
  thisMonth:    TRANSACTIONS.filter((t) => t.date.startsWith("Jun") && t.status === "paid").reduce((s, t) => s + parseFloat(t.amount.replace(/[₱,−]/g, "")), 0),
};

export default function TransactionsPage() {
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [search, setSearch] = useState("");

  const filtered = TRANSACTIONS.filter((t) => {
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    const matchesSearch =
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.ref.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <OrgPageShell
      title="Transaction History"
      subtitle="A full record of all payments and refunds for your organization."
      breadcrumbs={[
        { label: "Dashboard",  href: "/org_owner/dashboard" },
        { label: "Billing",    href: "/org_owner/billing" },
        { label: "Transactions" },
      ]}
      action={<Button variant="ghost" size="sm">Export CSV</Button>}
    >
      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-4 mb-7">
        <div className="bg-navy p-5">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-gold/70 mb-1">Total Paid</p>
          <p className="font-serif font-bold text-gold text-[1.75rem] leading-none tabular-nums">
            ₱{SUMMARY.totalPaid.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-caption text-white/40 mt-1">All time</p>
        </div>
        <div className="bg-surface border border-border p-5">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted mb-1">This Month</p>
          <p className="font-serif font-bold text-charcoal text-[1.75rem] leading-none tabular-nums">
            ₱{SUMMARY.thisMonth.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-caption text-muted mt-1">June 2026</p>
        </div>
        <div className="bg-surface border border-border p-5">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted mb-1">Total Transactions</p>
          <p className="font-serif font-bold text-charcoal text-[1.75rem] leading-none">{TRANSACTIONS.length}</p>
          <p className="text-caption text-muted mt-1">Including refunds</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative max-w-xs flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input type="text" placeholder="Search by description or reference…" value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 bg-surface border border-border text-small text-charcoal placeholder:text-muted focus:outline-none focus:border-navy transition-colors" />
        </div>
        <div className="flex gap-1">
          {(["all", "paid", "pending", "failed", "refunded"] as FilterStatus[]).map((s) => (
            <button key={s} type="button" onClick={() => setStatusFilter(s)}
              className={`h-9 px-3 text-caption font-medium transition-colors border capitalize
                ${statusFilter === s ? "bg-navy text-white border-navy" : "bg-surface text-muted border-border hover:border-navy hover:text-navy"}`}>
              {s === "all" ? "All" : STATUS_BADGE[s as TxStatus]?.label ?? s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="border border-border bg-surface overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[680px]">
          <thead>
            <tr className="border-b border-border bg-navy/4">
              <th className="px-4 py-3 text-caption font-semibold uppercase tracking-[0.1em] text-muted">Date</th>
              <th className="px-4 py-3 text-caption font-semibold uppercase tracking-[0.1em] text-muted">Description</th>
              <th className="px-4 py-3 text-caption font-semibold uppercase tracking-[0.1em] text-muted hidden sm:table-cell">Type</th>
              <th className="px-4 py-3 text-caption font-semibold uppercase tracking-[0.1em] text-muted">Amount</th>
              <th className="px-4 py-3 text-caption font-semibold uppercase tracking-[0.1em] text-muted hidden md:table-cell">Reference</th>
              <th className="px-4 py-3 text-caption font-semibold uppercase tracking-[0.1em] text-muted hidden md:table-cell">Method</th>
              <th className="px-4 py-3 text-caption font-semibold uppercase tracking-[0.1em] text-muted">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-small text-muted">
                  No transactions found.
                </td>
              </tr>
            ) : (
              filtered.map((tx) => (
                <tr key={tx.id} className="border-b border-border/60 last:border-b-0 hover:bg-slate/30 transition-colors">
                  <td className="px-4 py-3 text-small text-muted whitespace-nowrap">{tx.date}</td>
                  <td className="px-4 py-3">
                    <p className="text-small font-medium text-charcoal">{tx.description}</p>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-caption text-muted">{TYPE_LABEL[tx.type]}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-small font-semibold tabular-nums ${tx.type === "refund" ? "text-error" : "text-charcoal"}`}>
                      {tx.amount}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="font-mono text-caption text-muted">{tx.ref}</span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-caption text-muted">{tx.paymentMethod}</span>
                  </td>
                  <td className="px-4 py-3">
                    <OrgBadge variant={STATUS_BADGE[tx.status].variant}>{STATUS_BADGE[tx.status].label}</OrgBadge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" className="text-caption text-muted hover:text-navy transition-colors whitespace-nowrap">Receipt</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {filtered.length > 0 && (
        <p className="text-caption text-muted mt-3">
          Showing {filtered.length} of {TRANSACTIONS.length} transactions
        </p>
      )}
    </OrgPageShell>
  );
}
