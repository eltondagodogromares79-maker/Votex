"use client";

import { useMemo, useState } from "react";
import OrgPageShell from "@/src/features/org_owner/components/OrgPageShell";
import OrgBadge from "@/src/features/org_owner/components/OrgBadge";
import { Button } from "@/src/components/ui/Button";
import { useSession } from "@/src/features/auth/context/SessionContext";
import { useTransactions } from "@/src/features/org_owner/hooks/useTransactions";
import type { OrganizationTransaction } from "@/src/types";

const PAGE_SIZE = 50;
type FilterStatus = "all" | "paid" | "pending" | "failed" | "refunded";
type BadgeVariant = "success" | "warning" | "error" | "muted";

function statusInfo(status: string): { label: string; variant: BadgeVariant } {
  switch (status.toUpperCase()) {
    case "COMPLETED": return { label: "Paid", variant: "success" };
    case "PENDING":
    case "PROCESSING": return { label: "Pending", variant: "warning" };
    case "REFUNDED":
    case "REVERSED": return { label: "Refunded / reversed", variant: "muted" };
    case "FAILED":
    case "CANCELLED": return { label: status === "CANCELLED" ? "Cancelled" : "Failed", variant: "error" };
    default: return { label: status.replaceAll("_", " "), variant: "muted" };
  }
}

function matchesFilter(status: string, filter: FilterStatus) {
  if (filter === "all") return true;
  const key = status.toUpperCase();
  if (filter === "paid") return key === "COMPLETED";
  if (filter === "pending") return key === "PENDING" || key === "PROCESSING";
  if (filter === "failed") return key === "FAILED" || key === "CANCELLED";
  return key === "REFUNDED" || key === "REVERSED";
}

function typeLabel(type: string) {
  switch (type.toUpperCase()) {
    case "SUBSCRIPTION_PAYMENT":
    case "SUBSCRIPTION_CHANGE": return "Subscription";
    case "VOTE": return "Vote purchase";
    case "PAYMENT": return "Payment";
    default: return type.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
  }
}

function reference(tx: OrganizationTransaction) {
  return tx.providerTransactionId ?? tx.referenceId ?? tx.id;
}

function formatAmount(amount: string | null, currency: string | null) {
  if (amount == null) return "—";
  if (!currency) return amount;
  const value = Number(amount);
  if (!Number.isFinite(value)) return `${currency} ${amount}`;
  try {
    return new Intl.NumberFormat("en-PH", { style: "currency", currency, maximumFractionDigits: 2 }).format(value);
  } catch {
    return `${currency} ${amount}`;
  }
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" });
}

function csvCell(value: string | null | undefined) {
  return `"${(value ?? "").replaceAll('"', '""')}"`;
}

function exportCsv(items: OrganizationTransaction[]) {
  const header = ["Date", "Description", "Type", "Amount", "Currency", "Reference", "Provider", "Status"];
  const rows = items.map((tx) => [
    tx.createdAt,
    tx.description,
    typeLabel(tx.transactionType),
    tx.amount,
    tx.currency,
    reference(tx),
    tx.provider,
    tx.status,
  ]);
  const csv = [header, ...rows].map((row) => row.map((value) => csvCell(value == null ? "" : String(value))).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "votex-transaction-history.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export default function TransactionsPage() {
  const { currentUser } = useSession();
  const orgId = currentUser?.organizationId ?? "";
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const { data, isLoading, isError, refetch } = useTransactions(orgId, { limit: PAGE_SIZE, offset });
  const items = data?.items ?? [];

  const filtered = useMemo(() => items.filter((tx) => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || [tx.description, reference(tx), tx.provider ?? "", tx.pageantName ?? ""]
      .some((value) => value.toLowerCase().includes(query));
    return matchesSearch && matchesFilter(tx.status, statusFilter);
  }), [items, search, statusFilter]);

  const completedByCurrency = items
    .filter((tx) => tx.status.toUpperCase() === "COMPLETED" && tx.amount != null)
    .reduce<Record<string, number>>((totals, tx) => {
      const currency = tx.currency ?? "Unknown currency";
      totals[currency] = (totals[currency] ?? 0) + Number(tx.amount);
      return totals;
    }, {});
  const completedSummary = Object.entries(completedByCurrency)
    .map(([currency, amount]) => formatAmount(String(amount), currency))
    .join(" · ") || "—";
  const refundedCount = items.filter((tx) => ["REFUNDED", "REVERSED"].includes(tx.status.toUpperCase())).length;

  return (
    <OrgPageShell
      title="Transaction History"
      subtitle="Payments and transaction records for your organization."
      breadcrumbs={[
        { label: "Dashboard", href: "/org_owner/dashboard" },
        { label: "Billing", href: "/org_owner/billing" },
        { label: "Transactions" },
      ]}
      action={<Button variant="ghost" size="sm" disabled={!filtered.length} onClick={() => exportCsv(filtered)}>Export current results</Button>}
    >
      <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="bg-navy p-5">
          <p className="mb-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-gold/70">Completed in results</p>
          <p className="font-serif text-xl font-bold tabular-nums leading-tight text-gold">{isLoading ? "Loading…" : completedSummary}</p>
          <p className="mt-1 text-caption text-white/40">Current page, grouped by currency</p>
        </div>
        <div className="border border-border bg-surface p-5">
          <p className="mb-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted">Refunded or reversed</p>
          <p className="font-serif text-[1.75rem] font-bold leading-none tabular-nums text-charcoal">{isLoading ? "—" : refundedCount}</p>
          <p className="mt-1 text-caption text-muted">On this page</p>
        </div>
        <div className="border border-border bg-surface p-5">
          <p className="mb-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted">Transactions loaded</p>
          <p className="font-serif text-[1.75rem] font-bold leading-none tabular-nums text-charcoal">{isLoading ? "—" : items.length}</p>
          <p className="mt-1 text-caption text-muted">Page size {data?.limit ?? PAGE_SIZE}</p>
        </div>
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative max-w-xs flex-1">
          <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input type="text" placeholder="Search description, reference, provider…" value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-9 w-full border border-border bg-surface pl-9 pr-3 text-small text-charcoal placeholder:text-muted transition-colors focus:border-navy focus:outline-none" />
        </div>
        <div className="flex flex-wrap gap-1">
          {(["all", "paid", "pending", "failed", "refunded"] as FilterStatus[]).map((status) => (
            <button key={status} type="button" onClick={() => setStatusFilter(status)}
              className={`h-9 border px-3 text-caption font-medium capitalize transition-colors ${statusFilter === status ? "border-navy bg-navy text-white" : "border-border bg-surface text-muted hover:border-navy hover:text-navy"}`}>
              {status === "all" ? "All" : status === "paid" ? "Paid" : status === "refunded" ? "Refunded" : status === "failed" ? "Failed / cancelled" : "Pending"}
            </button>
          ))}
        </div>
      </div>

      {isError ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border border-error/25 bg-surface p-5">
          <p className="text-small text-error">Could not load transaction history.</p>
          <Button variant="secondary" size="sm" onClick={() => refetch()}>Try again</Button>
        </div>
      ) : (
        <>
          <div className="overflow-hidden overflow-x-auto border border-border bg-surface">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead>
                <tr className="border-b border-border bg-navy/4">
                  <th className="px-4 py-3 text-caption font-semibold uppercase tracking-[0.1em] text-muted">Date</th>
                  <th className="px-4 py-3 text-caption font-semibold uppercase tracking-[0.1em] text-muted">Description</th>
                  <th className="hidden px-4 py-3 text-caption font-semibold uppercase tracking-[0.1em] text-muted sm:table-cell">Type</th>
                  <th className="px-4 py-3 text-caption font-semibold uppercase tracking-[0.1em] text-muted">Amount</th>
                  <th className="hidden px-4 py-3 text-caption font-semibold uppercase tracking-[0.1em] text-muted md:table-cell">Reference</th>
                  <th className="hidden px-4 py-3 text-caption font-semibold uppercase tracking-[0.1em] text-muted md:table-cell">Provider</th>
                  <th className="px-4 py-3 text-caption font-semibold uppercase tracking-[0.1em] text-muted">Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-small text-muted">Loading transactions…</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-small text-muted">{items.length ? "No transactions match your search or filter." : "No transactions recorded yet."}</td></tr>
                ) : filtered.map((tx) => {
                  const status = statusInfo(tx.status);
                  return (
                    <tr key={`${tx.source}-${tx.id}`} className="border-b border-border/60 last:border-b-0 hover:bg-slate/30">
                      <td className="whitespace-nowrap px-4 py-3 text-small text-muted">{formatDate(tx.createdAt)}</td>
                      <td className="px-4 py-3">
                        <p className="text-small font-medium text-charcoal">{tx.description}</p>
                        {tx.pageantName && <p className="mt-0.5 text-caption text-muted">{tx.pageantName}</p>}
                      </td>
                      <td className="hidden px-4 py-3 text-caption text-muted sm:table-cell">{typeLabel(tx.transactionType)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-small font-semibold tabular-nums text-charcoal">{formatAmount(tx.amount, tx.currency)}</td>
                      <td className="hidden max-w-48 truncate px-4 py-3 font-mono text-caption text-muted md:table-cell" title={reference(tx)}>{reference(tx)}</td>
                      <td className="hidden px-4 py-3 text-caption text-muted md:table-cell">{tx.provider ?? "—"}</td>
                      <td className="px-4 py-3"><OrgBadge variant={status.variant}>{status.label}</OrgBadge></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-caption text-muted">
              {items.length ? `Showing ${offset + 1}–${offset + items.length}${items.length === data?.limit ? " or more" : ""}` : "Showing 0 transactions"}
              {filtered.length !== items.length && ` · ${filtered.length} match current filters`}
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" disabled={offset === 0 || isLoading} onClick={() => setOffset(Math.max(offset - PAGE_SIZE, 0))}>Previous</Button>
              <Button variant="secondary" size="sm" disabled={items.length < (data?.limit ?? PAGE_SIZE) || isLoading} onClick={() => setOffset(offset + PAGE_SIZE)}>Next</Button>
            </div>
          </div>
        </>
      )}
    </OrgPageShell>
  );
}
