"use client";

import { useState } from "react";
import OrgPageShell from "@/src/features/org_owner/components/OrgPageShell";
import OrgBadge from "@/src/features/org_owner/components/OrgBadge";
import { Button } from "@/src/components/ui/Button";
import { useSession } from "@/src/features/auth/context/SessionContext";
import { useActivityLogs } from "@/src/features/org_owner/hooks/useActivityLogs";
import type { OrganizationActivityLog } from "@/src/types";

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("en-PH", {
    year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
}

function prettify(value: string) {
  return value.toLowerCase().split(/[_\s-]+/).filter(Boolean).map(part => part[0].toUpperCase() + part.slice(1)).join(" ");
}

function activityLabel(entry: OrganizationActivityLog) {
  const method = typeof entry.afterData?.method === "string" ? entry.afterData.method : "";
  const endpoint = typeof entry.afterData?.endpoint === "string" ? entry.afterData.endpoint : "";
  if (endpoint.includes("/vote-packages/") && endpoint.endsWith("/activate")) return "Activate vote package";
  if (endpoint.includes("/pageants/") && endpoint.endsWith("/restore")) return "Restore pageant";
  if (endpoint.endsWith("/vote-packages") && method === "POST") return "Create vote package";
  if (entry.action === "CREATED_OR_SUBMITTED" || entry.action.includes("CREATED_OR_SUBMITTED")) {
    return `Submit ${prettify(entry.resourceType).toLowerCase()}`;
  }
  const labels: Record<string, string> = {
    VOTE_PACKAGE_ACTIVATED: "Activate vote package",
    VOTE_PACKAGE_DEACTIVATED: "Deactivate vote package",
    VOTE_PACKAGE_CREATED: "Create vote package",
    VOTE_PACKAGE_UPDATED: "Update vote package",
    PAGEANT_RESTORED: "Restore pageant",
    PAGEANT_ARCHIVED: "Archive pageant",
  };
  return labels[entry.action] ?? prettify(entry.action);
}

export default function ActivityLogsPage() {
  const { currentUser } = useSession();
  const orgId = currentUser?.organizationId ?? "";
  const [offset, setOffset] = useState(0);
  const [resultFilter, setResultFilter] = useState("all");
  const success = resultFilter === "all" ? undefined : resultFilter === "success";
  const { data, isLoading, isError, refetch, isFetching } = useActivityLogs(orgId, offset, success);
  const entries = data?.items ?? [];

  return (
    <OrgPageShell
      title="Activity Logs"
      subtitle="Review actions made across your organization and their request outcomes."
      breadcrumbs={[{ label: "Dashboard", href: "/org_owner/dashboard" }, { label: "Activity Logs" }]}
      action={
        <div className="flex items-center gap-2">
          <select
            aria-label="Filter activity results"
            value={resultFilter}
            onChange={event => { setOffset(0); setResultFilter(event.target.value); }}
            className="h-9 border border-border bg-surface px-3 text-small text-charcoal focus:outline-none focus:border-navy"
          >
            <option value="all">All results</option>
            <option value="success">Successful</option>
            <option value="failed">Failed</option>
          </select>
          <Button variant="secondary" size="sm" onClick={() => refetch()} loading={isFetching}>Refresh</Button>
        </div>
      }
    >
      <div className="mb-5 border border-border bg-surface px-4 py-3 text-caption text-muted">
        Activity entries are recorded for organization changes. Request bodies and secrets are not stored.
      </div>

      {isError && (
        <div className="border border-error/25 bg-surface p-5">
          <p className="text-small font-semibold text-error">Could not load activity logs.</p>
          <button onClick={() => refetch()} className="mt-2 text-caption font-medium text-navy hover:underline">Try again</button>
        </div>
      )}

      {isLoading && !isError && <div className="h-56 animate-pulse border border-border bg-surface" />}

      {!isLoading && !isError && entries.length === 0 && (
        <div className="border border-border bg-surface px-6 py-14 text-center">
          <p className="font-serif text-h3 font-semibold text-charcoal">No activity yet</p>
          <p className="mt-2 text-small text-muted">Successful changes and rejected changes will appear here.</p>
        </div>
      )}

      {!isLoading && !isError && entries.length > 0 && (
        <>
          <div className="overflow-hidden border border-border bg-surface">
            <div className="divide-y divide-border">
              {entries.map(entry => {
                return (
                  <article key={entry.id} className="grid gap-3 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:px-5">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-small font-semibold text-charcoal">{activityLabel(entry)}</h2>
                        <OrgBadge variant={entry.success ? "success" : "warning"}>{entry.success ? "Succeeded" : "Failed"}</OrgBadge>
                      </div>
                      <p className="mt-1 text-caption text-muted">
                        {entry.actorName || "Organization member"} · {prettify(entry.resourceType)}
                      </p>
                      {!entry.success && (
                        <p className="mt-1 text-caption text-error">
                          {typeof entry.afterData?.endpoint === "string" && entry.afterData.endpoint.includes("/vote-packages/") && entry.afterData.endpoint.endsWith("/activate") && entry.afterData.status === 409
                            ? "The package couldn’t be activated because of its current status. Check that it is inactive and its pageant is not archived."
                            : "This action couldn’t be completed. Review the current status and try again."}
                        </p>
                      )}
                    </div>
                    <time className="text-caption tabular-nums text-muted sm:text-right" dateTime={entry.createdAt}>
                      {formatDate(entry.createdAt)}
                    </time>
                  </article>
                );
              })}
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between gap-4">
            <p className="text-caption text-muted">Showing {offset + 1}–{offset + entries.length}{data?.items.length === data?.limit ? "" : " · end of results"}</p>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" disabled={offset === 0 || isFetching} onClick={() => setOffset(value => Math.max(0, value - 50))}>Previous</Button>
              <Button variant="secondary" size="sm" disabled={entries.length < 50 || isFetching} onClick={() => setOffset(value => value + 50)}>Next</Button>
            </div>
          </div>
        </>
      )}
    </OrgPageShell>
  );
}
