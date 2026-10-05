"use client";

import { useState } from "react";
import AdminPageShell from "@/src/features/admin/components/AdminPageShell";
import { useAuditLogs } from "@/src/features/admin/hooks/useAuditLogs";

const PAGE_SIZE = 50;

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`bg-surface border border-border animate-pulse ${className}`} />;
}

export default function AdminAuditLogsPage() {
  const [offset,        setOffset]        = useState(0);
  const [resourceType,  setResourceType]  = useState("");
  const [successFilter, setSuccessFilter] = useState<"" | "true" | "false">("");

  const query: Record<string, unknown> = { limit: PAGE_SIZE, offset };
  if (resourceType)              query.resource_type = resourceType;
  if (successFilter !== "")      query.success = successFilter === "true";

  const { data, isLoading, isError } = useAuditLogs(query);
  const items = data?.items ?? [];
  const hasMore = items.length === PAGE_SIZE;

  const resourceTypes = ["USER","ORGANIZATION","PAGEANT","COORDINATOR","JUDGE","TABULATOR","VOTE_PACKAGE","SUBSCRIPTION"];

  return (
    <AdminPageShell
      title="Audit Logs"
      subtitle="Track all platform actions and changes."
      breadcrumbs={[{ label: "Dashboard", href: "/admin/dashboard" }, { label: "Moderation" }, { label: "Audit Logs" }]}
    >
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <select
          value={resourceType}
          onChange={e => { setResourceType(e.target.value); setOffset(0); }}
          className="h-9 px-3 bg-surface border border-border text-small text-charcoal focus:outline-none focus:border-navy transition-colors"
        >
          <option value="">All resource types</option>
          {resourceTypes.map(r => <option key={r} value={r}>{r}</option>)}
        </select>

        <select
          value={successFilter}
          onChange={e => { setSuccessFilter(e.target.value as "" | "true" | "false"); setOffset(0); }}
          className="h-9 px-3 bg-surface border border-border text-small text-charcoal focus:outline-none focus:border-navy transition-colors"
        >
          <option value="">All outcomes</option>
          <option value="true">Success</option>
          <option value="false">Failed</option>
        </select>
      </div>

      {isLoading && (
        <div className="space-y-2">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
      )}

      {isError && (
        <div className="bg-error/8 border border-error/20 px-5 py-4">
          <p className="text-small font-semibold text-error">Failed to load audit logs.</p>
        </div>
      )}

      {!isLoading && !isError && (
        <>
          <div className="border border-border bg-surface overflow-hidden">
            <div className="hidden md:flex items-center px-5 py-2.5 border-b border-border bg-slate/40 gap-4">
              <p className="w-20 text-caption text-muted uppercase tracking-[0.08em]">Result</p>
              <p className="flex-1 text-caption text-muted uppercase tracking-[0.08em]">Action</p>
              <p className="w-28 hidden lg:block text-caption text-muted uppercase tracking-[0.08em]">Resource</p>
              <p className="w-36 hidden lg:block text-caption text-muted uppercase tracking-[0.08em]">Actor</p>
              <p className="w-36 text-right text-caption text-muted uppercase tracking-[0.08em]">Time</p>
            </div>

            {items.length === 0 && (
              <div className="px-5 py-10 text-center">
                <p className="text-small text-muted">No audit logs found.</p>
              </div>
            )}

            {items.map(log => (
              <div key={log.id}
                className="flex items-center gap-4 px-5 py-3.5 border-b border-border/60 last:border-b-0 hover:bg-slate/30 transition-colors">
                {/* Result */}
                <div className="w-20 shrink-0">
                  <span className={`inline-flex items-center h-5 px-2 text-[10px] font-semibold uppercase tracking-wider border ${
                    log.success ? "bg-success/8 border-success/25 text-success" : "bg-error/8 border-error/25 text-error"
                  }`}>
                    {log.success ? "OK" : "Fail"}
                  </span>
                </div>
                {/* Action */}
                <div className="flex-1 min-w-0">
                  <p className="text-small font-semibold text-charcoal truncate">{log.action.replace(/_/g, " ")}</p>
                  {log.failureReason && (
                    <p className="text-caption text-error truncate">{log.failureReason}</p>
                  )}
                </div>
                {/* Resource */}
                <div className="w-28 hidden lg:block min-w-0">
                  <p className="text-caption font-mono text-muted truncate">{log.resourceType}</p>
                </div>
                {/* Actor */}
                <div className="w-36 hidden lg:block min-w-0">
                  <p className="text-small text-charcoal truncate">{log.actorName ?? "—"}</p>
                  <p className="text-caption text-muted truncate">{log.actorEmail ?? ""}</p>
                </div>
                {/* Time */}
                <div className="w-36 text-right shrink-0">
                  <p className="text-caption text-muted">
                    {new Date(log.createdAt).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                  <p className="text-caption text-muted">
                    {new Date(log.createdAt).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-4">
            <p className="text-caption text-muted">{items.length} log{items.length !== 1 ? "s" : ""} loaded</p>
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
