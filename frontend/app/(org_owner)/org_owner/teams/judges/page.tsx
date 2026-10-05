"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import OrgPageShell from "@/src/features/org_owner/components/OrgPageShell";
import OrgBadge from "@/src/features/org_owner/components/OrgBadge";
import OrgEmptyState from "@/src/features/org_owner/components/OrgEmptyState";
import OrgDataTable, { type OrgTableColumn } from "@/src/features/org_owner/components/OrgDataTable";
import { Button } from "@/src/components/ui/Button";
import { Modal, ConfirmModal } from "@/src/components/ui/Modal";
import { useSession } from "@/src/features/auth/context/SessionContext";
import { usePageants } from "@/src/features/org_owner/hooks/usePageants";
import {
  usePageantJudges,
  useAssignJudge,
  useRevokeJudge,
} from "@/src/features/org_owner/hooks/usePageantStaff";
import { useToast } from "@/src/components/ui/Toast";
import { ApiError } from "@/src/lib/api/client";
import type { PageantStaffResponse, PageantResponse } from "@/src/types";

// ─── Schema ───────────────────────────────────────────────────────────────────

const addSchema = z.object({
  email:     z.string().min(1, "Email is required").email("Enter a valid email"),
  firstName: z.string().min(1, "First name is required").max(100),
  lastName:  z.string().min(1, "Last name is required").max(100),
});

type AddFormValues = z.infer<typeof addSchema>;

// ─── Design tokens ────────────────────────────────────────────────────────────

const fieldLabel = "block text-small font-medium text-white/80 mb-1.5";
const fieldInput = "w-full h-10 px-3 bg-white/8 border border-white/15 text-white text-small placeholder:text-white/30 focus:outline-none focus:border-gold/60 transition-colors duration-150";
const fieldError = "text-caption text-error mt-1";

// ─── Row type (judge + pageant context) ──────────────────────────────────────

interface JudgeRow extends PageantStaffResponse {
  pageantId: string;
  pageantName: string;
}

// ─── Per-pageant judge fetcher (invisible fan-out component) ──────────────────

function JudgeFetcher({
  orgId,
  pageant,
  onLoaded,
}: {
  orgId: string;
  pageant: PageantResponse;
  onLoaded: (pageantId: string, pageantName: string, judges: PageantStaffResponse[]) => void;
}) {
  const { data } = usePageantJudges(orgId, pageant.id);
  useEffect(() => {
    if (data) onLoaded(pageant.id, pageant.name, data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);
  return null;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-navy p-5">
      <p className="text-caption text-white/55 uppercase tracking-wide mb-2">{label}</p>
      <p className="font-serif font-bold text-2xl text-gold tabular-nums">{value}</p>
      {sub && <p className="text-caption text-white/40 mt-1.5">{sub}</p>}
    </div>
  );
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`bg-surface border border-border animate-pulse ${className}`} />;
}

function JudgeIcon() {
  return (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.25} viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  );
}

function Field({ label, error, hint, children }: {
  label: React.ReactNode; error?: string; hint?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className={fieldLabel}>{label}</label>
      {children}
      {error && <p className={fieldError}>{error}</p>}
      {!error && hint && <p className="text-caption text-white/40 mt-1">{hint}</p>}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function JudgesPage() {
  const { currentUser } = useSession();
  const orgId = currentUser?.organizationId ?? "";
  const { toast } = useToast();

  const { data: pageants = [], isLoading: pageantsLoading } = usePageants(orgId);

  // ── Fan-out results map: pageantId → judges ───────────────────────────────
  const [judgesMap, setJudgesMap] = useState<Map<string, { name: string; judges: PageantStaffResponse[] }>>(new Map());

  function handleJudgesLoaded(pageantId: string, pageantName: string, judges: PageantStaffResponse[]) {
    setJudgesMap(prev => {
      const next = new Map(prev);
      next.set(pageantId, { name: pageantName, judges });
      return next;
    });
  }

  // ── Derived flat list ─────────────────────────────────────────────────────
  const allJudges: JudgeRow[] = [];
  for (const [pageantId, { name, judges }] of judgesMap) {
    for (const j of judges) {
      allJudges.push({ ...j, pageantId, pageantName: name });
    }
  }

  // ── Selected pageant for add/remove actions ───────────────────────────────
  const [selectedPageantId, setSelectedPageantId] = useState("");
  const selectedPageant = pageants.find(p => p.id === selectedPageantId);

  const assignMutation = useAssignJudge(orgId, selectedPageantId);
  const revokeMutation = useRevokeJudge(orgId, selectedPageantId);

  // ── Modal state ───────────────────────────────────────────────────────────
  const [search,       setSearch]       = useState("");
  const [showAdd,      setShowAdd]      = useState(false);
  const [removeTarget, setRemoveTarget] = useState<JudgeRow | null>(null);

  // ── Add form ──────────────────────────────────────────────────────────────
  const addForm = useForm<AddFormValues>({ resolver: zodResolver(addSchema) });

  function openAdd() { addForm.reset(); setShowAdd(true); }
  function closeAdd() { setShowAdd(false); addForm.reset(); }

  async function onAdd(data: AddFormValues) {
    try {
      await assignMutation.mutateAsync({ email: data.email, firstName: data.firstName, lastName: data.lastName });
      toast.success(`${data.firstName} ${data.lastName} assigned as judge.`);
      closeAdd();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.userMessage : "Failed to assign judge.");
    }
  }

  // ── Remove ────────────────────────────────────────────────────────────────
  // For remove we use the row's own pageantId
  const removeRevokeMutation = useRevokeJudge(orgId, removeTarget?.pageantId ?? "");

  async function onConfirmRemove() {
    if (!removeTarget) return;
    try {
      await removeRevokeMutation.mutateAsync(removeTarget.userId);
      toast.success(`${removeTarget.firstName} ${removeTarget.lastName} removed.`);
      setRemoveTarget(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.userMessage : "Failed to remove judge.");
    }
  }

  // ── Stats ─────────────────────────────────────────────────────────────────
  const activeCount   = allJudges.filter(j => j.isActive).length;
  const inactiveCount = allJudges.length - activeCount;
  const allLoaded     = !pageantsLoading && judgesMap.size === pageants.length;

  // ── Filter ────────────────────────────────────────────────────────────────
  const [filterPageant, setFilterPageant] = useState("all");

  const filtered = allJudges.filter(j => {
    const q = search.toLowerCase();
    const matchSearch =
      j.firstName.toLowerCase().includes(q) ||
      j.lastName.toLowerCase().includes(q)  ||
      j.email.toLowerCase().includes(q);
    const matchPageant = filterPageant === "all" || j.pageantId === filterPageant;
    return matchSearch && matchPageant;
  });

  // ── Table columns ─────────────────────────────────────────────────────────
  const COLUMNS: OrgTableColumn<JudgeRow>[] = [
    {
      key: "judge",
      header: "Judge",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-navy flex items-center justify-center shrink-0">
            <span className="font-serif font-bold text-gold text-caption leading-none">
              {row.firstName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-small font-semibold text-charcoal leading-tight truncate">
              {row.firstName} {row.lastName}
            </p>
            <p className="text-caption text-muted truncate">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "pageant",
      header: "Pageant",
      hideOnMobile: true,
      render: (row) => (
        <span className="inline-flex items-center h-5 px-2 text-[10px] font-medium bg-navy/8 border border-navy/15 text-navy truncate max-w-[180px]" title={row.pageantName}>
          {row.pageantName}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <OrgBadge variant={row.isActive ? "success" : "muted"}>
          {row.isActive ? "Active" : "Inactive"}
        </OrgBadge>
      ),
      cellClass: "w-28",
    },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <div className="flex items-center justify-end">
          <Button variant="danger" size="sm" onClick={() => setRemoveTarget(row)}>
            Remove
          </Button>
        </div>
      ),
      cellClass: "w-28",
    },
  ];

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <OrgPageShell
      title="Judges"
      subtitle="All judges assigned across your pageants."
      breadcrumbs={[
        { label: "Dashboard", href: "/org_owner/dashboard" },
        { label: "Teams" },
        { label: "Judges" },
      ]}
      action={
        <div className="flex items-center gap-2">
          {pageantsLoading ? (
            <div className="h-9 w-44 bg-surface border border-border animate-pulse" />
          ) : (
            <select
              value={selectedPageantId}
              onChange={e => setSelectedPageantId(e.target.value)}
              className="h-9 px-3 bg-surface border border-border text-small text-charcoal focus:outline-none focus:border-navy transition-colors"
            >
              <option value="">— Select pageant to add judge —</option>
              {pageants.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
          {selectedPageantId && (
            <Button variant="secondary" size="sm" onClick={openAdd}>
              + Add Judge
            </Button>
          )}
        </div>
      }
    >
      {/* Fan-out fetchers */}
      {pageants.map(p => (
        <JudgeFetcher key={p.id} orgId={orgId} pageant={p} onLoaded={handleJudgesLoaded} />
      ))}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Total"    value={allLoaded ? allJudges.length : "—"} sub="across all pageants" />
        <StatCard label="Active"   value={allLoaded ? activeCount : "—"}      sub={allLoaded ? `of ${allJudges.length} total` : ""} />
        <StatCard label="Inactive" value={allLoaded ? inactiveCount : "—"}    sub="removed or inactive" />
      </div>

      {/* Loading state */}
      {!allLoaded && (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14" />)}
        </div>
      )}

      {/* Content */}
      {allLoaded && (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="relative flex-1 max-w-sm">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none"
                fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="text" placeholder="Search by name or email…" value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-3 bg-surface border border-border text-small text-charcoal placeholder:text-muted focus:outline-none focus:border-navy transition-colors"
              />
            </div>
            {pageants.length > 1 && (
              <select
                value={filterPageant}
                onChange={e => setFilterPageant(e.target.value)}
                className="h-9 px-3 bg-surface border border-border text-small text-charcoal focus:outline-none focus:border-navy transition-colors"
              >
                <option value="all">All pageants</option>
                {pageants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            )}
          </div>

          {filtered.length === 0 ? (
            <OrgEmptyState
              icon={<JudgeIcon />}
              heading={search || filterPageant !== "all" ? "No judges found" : "No judges assigned yet"}
              description={
                search || filterPageant !== "all"
                  ? "Try adjusting your search or filter."
                  : "Go to a pageant's Staff page to assign judges."
              }
            />
          ) : (
            <>
              <OrgDataTable columns={COLUMNS} data={filtered} keyExtractor={r => `${r.pageantId}-${r.userId}`} />
              <p className="text-caption text-muted mt-3">
                Showing {filtered.length} of {allJudges.length} judge{allJudges.length !== 1 ? "s" : ""}
              </p>
            </>
          )}
        </>
      )}

      {/* Add judge modal */}
      <Modal
        open={showAdd}
        onClose={closeAdd}
        title="Add Judge"
        description={`Assign a judge to ${selectedPageant?.name ?? "this pageant"}.`}
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={closeAdd} disabled={addForm.formState.isSubmitting}>
              Cancel
            </Button>
            <Button variant="secondary" size="sm" form="add-judge-form" type="submit" loading={addForm.formState.isSubmitting}>
              Add Judge
            </Button>
          </>
        }
      >
        <form id="add-judge-form" onSubmit={addForm.handleSubmit(onAdd)} noValidate className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Field label={<>First Name <span className="text-error">*</span></>} error={addForm.formState.errors.firstName?.message}>
              <input type="text" placeholder="Roberto" autoComplete="given-name" className={fieldInput} {...addForm.register("firstName")} />
            </Field>
            <Field label={<>Last Name <span className="text-error">*</span></>} error={addForm.formState.errors.lastName?.message}>
              <input type="text" placeholder="Cruz" autoComplete="family-name" className={fieldInput} {...addForm.register("lastName")} />
            </Field>
          </div>
          <Field
            label={<>Email Address <span className="text-error">*</span></>}
            error={addForm.formState.errors.email?.message}
            hint="An existing account will be linked, or a new account created with credentials emailed automatically."
          >
            <input type="email" placeholder="judge@example.com" autoComplete="email" className={fieldInput} {...addForm.register("email")} />
          </Field>
          <div className="flex gap-3 bg-white/5 border border-white/15 px-4 py-3">
            <svg className="w-4 h-4 text-gold/70 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
            <p className="text-caption text-white/50 leading-relaxed">
              If a new account is created, a temporary password will be generated and emailed. They should change it after their first sign-in.
            </p>
          </div>
        </form>
      </Modal>

      {/* Remove confirm */}
      <ConfirmModal
        open={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        onConfirm={onConfirmRemove}
        title="Remove Judge"
        description={
          removeTarget
            ? `Remove ${removeTarget.firstName} ${removeTarget.lastName} from "${removeTarget.pageantName}"? They will no longer be able to submit scores.`
            : ""
        }
        confirmLabel="Remove"
        loading={removeRevokeMutation.isPending}
        destructive
      />

    </OrgPageShell>
  );
}
