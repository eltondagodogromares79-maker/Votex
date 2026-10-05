"use client";

import Link from "next/link";
import AdminPageShell from "@/src/features/admin/components/AdminPageShell";
import { useRevenue } from "@/src/features/admin/hooks/useRevenue";
import { useUsers } from "@/src/features/admin/hooks/useUsers";
import { useOrganizations } from "@/src/features/admin/hooks/useOrganizations";
import { useTransactionLogs } from "@/src/features/admin/hooks/useAuditLogs";

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, href, accent = false,
}: {
  label: string; value: string | number; sub?: string; href?: string; accent?: boolean;
}) {
  const inner = (
    <div className={`bg-navy p-5 h-full ${href ? "group-hover:bg-navy/90 transition-colors" : ""}`}>
      <p className="text-caption text-white/50 uppercase tracking-[0.1em] mb-2">{label}</p>
      <p className={`font-serif font-bold text-[2rem] leading-none tabular-nums ${accent ? "text-gold" : "text-white"}`}>
        {value}
      </p>
      {sub && <p className="text-caption text-white/35 mt-2 leading-relaxed">{sub}</p>}
      {href && (
        <p className="text-caption text-gold/60 mt-3 flex items-center gap-1 group-hover:text-gold transition-colors">
          View all
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </p>
      )}
    </div>
  );
  return href ? (
    <Link href={href} className="group block">{inner}</Link>
  ) : (
    <div>{inner}</div>
  );
}

function SectionHeader({ title, href }: { title: string; href?: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="font-serif font-bold text-charcoal text-h3">{title}</h2>
      {href && (
        <Link href={href} className="text-caption text-navy hover:underline underline-offset-2 flex items-center gap-1">
          View all
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </Link>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const { data: revenue }       = useRevenue();
  const { data: users }         = useUsers({ limit: 100 });
  const { data: orgs }          = useOrganizations({ limit: 100 });
  const { data: recentTxLogs }  = useTransactionLogs({ limit: 5 });

  const totals     = revenue?.totalsByCurrency ?? [];
  const hasRevenue = totals.length > 0;
  const totalRev   = hasRevenue
    ? parseFloat(totals[0].amount).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "0.00";
  const currency   = hasRevenue ? totals[0].currency : "PHP";
  const totalTx    = hasRevenue ? totals.reduce((s, t) => s + t.completedTransactions, 0) : 0;

  const recentTx = recentTxLogs?.items ?? [];

  return (
    <AdminPageShell title="Dashboard" subtitle="Platform overview — organizations, users, and revenue.">

      {/* ── Stat grid ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard
          label="Total Revenue"
          value={`${currency} ${totalRev}`}
          sub="all-time completed"
          accent
        />
        <StatCard
          label="Transactions"
          value={totalTx.toLocaleString()}
          sub="completed payments"
          href="/admin/finance/payments"
        />
        <StatCard
          label="Organizations"
          value={orgs ? `${orgs.items.length}${orgs.items.length === 100 ? "+" : ""}` : "—"}
          sub="registered orgs"
          href="/admin/organizations"
        />
        <StatCard
          label="Users"
          value={users ? `${users.items.length}${users.items.length === 100 ? "+" : ""}` : "—"}
          sub="all platform users"
          href="/admin/users"
        />
      </div>

      {/* ── Revenue by org ────────────────────────────────────────────── */}
      {revenue?.organizations && revenue.organizations.length > 0 && (
        <section className="mb-10">
          <SectionHeader title="Revenue by Organization" href="/admin/finance/payments" />
          <div className="border border-border bg-surface overflow-hidden">
            <div className="hidden sm:flex items-center px-5 py-2.5 border-b border-border bg-slate/40">
              <p className="flex-1 text-caption text-muted uppercase tracking-[0.08em]">Organization</p>
              <p className="w-24 text-right text-caption text-muted uppercase tracking-[0.08em]">Txns</p>
              <p className="w-36 text-right text-caption text-muted uppercase tracking-[0.08em]">Revenue</p>
            </div>
            {revenue.organizations.map(org => (
              <div key={org.organizationId}
                className="flex items-center gap-4 px-5 py-3.5 border-b border-border/60 last:border-b-0 hover:bg-slate/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-small font-semibold text-charcoal truncate">{org.organizationName}</p>
                </div>
                <p className="w-24 text-right text-small text-muted tabular-nums">{org.completedTransactions}</p>
                <p className="w-36 text-right text-small font-semibold text-charcoal tabular-nums">
                  {org.currency} {parseFloat(org.amount).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Recent transactions ───────────────────────────────────────── */}
      <section>
        <SectionHeader title="Recent Transactions" href="/admin/finance/payments" />
        {recentTx.length === 0 ? (
          <div className="border border-border bg-surface px-5 py-8 text-center">
            <p className="text-small text-muted">No transactions yet.</p>
          </div>
        ) : (
          <div className="border border-border bg-surface overflow-hidden">
            {recentTx.map(tx => (
              <div key={tx.id}
                className="flex items-center gap-4 px-5 py-3.5 border-b border-border/60 last:border-b-0 hover:bg-slate/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-small font-semibold text-charcoal truncate">
                    {tx.transactionType.replace(/_/g, " ")}
                  </p>
                  <p className="text-caption text-muted truncate">{tx.organizationName ?? "—"}</p>
                </div>
                <span className={`inline-flex items-center h-5 px-2 text-[10px] font-semibold uppercase tracking-wider border shrink-0 ${
                  tx.status === "COMPLETED"
                    ? "bg-success/8 border-success/25 text-success"
                    : tx.status === "PENDING"
                    ? "bg-gold/10 border-gold/30 text-gold"
                    : "bg-border/30 border-border text-muted"
                }`}>
                  {tx.status}
                </span>
                {tx.amount && (
                  <p className="text-small font-semibold text-charcoal tabular-nums shrink-0">
                    {tx.currency} {parseFloat(tx.amount).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                )}
                <p className="text-caption text-muted shrink-0 hidden md:block">
                  {new Date(tx.createdAt).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

    </AdminPageShell>
  );
}
