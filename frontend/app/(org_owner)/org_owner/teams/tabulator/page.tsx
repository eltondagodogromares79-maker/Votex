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
import { useSubscriptionUsage } from "@/src/features/org_owner/hooks/useSubscription";
import {
  usePageantTabulators,
  useAssignTabulator,
  useRevokeTabulator,
  useSetPageantTabulatorActive,
  useDeletePageantTabulatorAssignment,
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

// ─── Row type ─────────────────────────────────────────────────────────────────

interface TabulatorRow extends PageantStaffResponse {
  pageantId: string;
  pageantName: string;
}

// ─── Per-pageant tabulator fetcher (invisible fan-out) ────────────────────────

function TabulatorFetcher({
  orgId,
  pageant,
  onLoaded,
}: {
  orgId: string;
  pageant: PageantResponse;
  onLoaded: (pageantId: string, pageantName: string, tabulators: PageantStaffResponse[]) => void;
}) {
  const { data } = usePageantTabulators(orgId, pageant.id);
  useEffect(() => {
    if (data) onLoaded(pageant.id, pageant.name, data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);
  return null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function TabulatorIcon() {
  return (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.25} viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75.125V5.625m0 12.75v-1.5m0 0a1.125 1.125 0 011.125-1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125m1.125-1.125V5.625m0 12.75h13.5m0-12.75h-13.5" />
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

export default function TabulatorsPage() {
  const { currentUser } = useSession();
  const orgId = currentUser?.organizationId ?? "";
  const { toast } = useToast();

  const { data: pageants = [], isLoading: pageantsLoading } = usePageants(orgId);
  const { data: planUsage, isLoading: usageLoading } = useSubscriptionUsage(orgId);

  // ── Fan-out results ───────────────────────────────────────────────────────
  const [tabMap, setTabMap] = useState<Map<string, { name: string; tabulators: PageantStaffResponse[] }>>(new Map());

  function handleTabsLoaded(pageantId: string, pageantName: string, tabulators: PageantStaffResponse[]) {
    setTabMap(prev => {
      const next = new Map(prev);
      next.set(pageantId, { name: pageantName, tabulators });
      return next;
    });
  }

  // ── Flat list ─────────────────────────────────────────────────────────────
  const allTabulators: TabulatorRow[] = [];
  for (const [pageantId, { name, tabulators }] of tabMap) {
    for (const t of tabulators) {
      allTabulators.push({ ...t, pageantId, pageantName: name });
    }
  }

  // ── Selected pageant for add/remove actions ───────────────────────────────
  const [selectedPageantId, setSelectedPageantId] = useState("");
  const selectedPageant = pageants.find(p => p.id === selectedPageantId);

  const assignMutation = useAssignTabulator(orgId, selectedPageantId);

  // ── Modal state ───────────────────────────────────────────────────────────
  const [search,        setSearch]        = useState("");
  const [filterPageant, setFilterPageant] = useState("all");
  const [showAdd,       setShowAdd]       = useState(false);
  const [confirmReuse, setConfirmReuse] = useState(false);
  const [removeTarget,  setRemoveTarget]  = useState<TabulatorRow | null>(null);
  const [removeAction, setRemoveAction] = useState<"activate" | "deactivate" | "delete">("deactivate");

  // Re-keyed revoke mutation for the specific row's pageant
  const rowRevokeMutation = useRevokeTabulator(orgId, removeTarget?.pageantId ?? "");
  const activateMutation = useSetPageantTabulatorActive(orgId, removeTarget?.pageantId ?? "", true);
  const deactivateMutation = useSetPageantTabulatorActive(orgId, removeTarget?.pageantId ?? "", false);
  const deleteMutation = useDeletePageantTabulatorAssignment(orgId, removeTarget?.pageantId ?? "");

  // ── Add form ──────────────────────────────────────────────────────────────
  const addForm = useForm<AddFormValues>({ resolver: zodResolver(addSchema) });

  function openAdd() { addForm.reset(); setConfirmReuse(false); setShowAdd(true); }
  function closeAdd() { setShowAdd(false); setConfirmReuse(false); addForm.reset(); }

  async function onAdd(data: AddFormValues, confirmed = false) {
    try {
      await assignMutation.mutateAsync({ email: data.email, firstName: data.firstName, lastName: data.lastName, confirmCrossOrganizationReuse: confirmed });
      toast.success(`${data.firstName} ${data.lastName} assigned as tabulator.`);
      closeAdd();
    } catch (err) {
      if (err instanceof ApiError && err.code === "STAFF_ACCOUNT_CROSS_ORGANIZATION") {
        setConfirmReuse(true);
        return;
      }
      toast.error(err instanceof ApiError ? err.userMessage : "Failed to assign tabulator.");
    }
  }

  async function onConfirmRemove() {
    if (!removeTarget) return;
    try {
      if (removeAction === "delete") await deleteMutation.mutateAsync(removeTarget.userId);
      else if (removeAction === "activate") await activateMutation.mutateAsync(removeTarget.userId);
      else await deactivateMutation.mutateAsync(removeTarget.userId);
      toast.success(removeAction === "delete" ? "Tabulator assignment deleted." : `Tabulator ${removeAction}d.`);
      setRemoveTarget(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.userMessage : "Failed to remove tabulator.");
    }
  }

  // ── Stats ─────────────────────────────────────────────────────────────────
  const activeCount = allTabulators.filter(t => t.isActive).length;
  const inactiveCount = allTabulators.length - activeCount;
  const allLoaded = !pageantsLoading && tabMap.size === pageants.length;

  // ── Filter ────────────────────────────────────────────────────────────────
  const filtered = allTabulators.filter(t => {
    const q = search.toLowerCase();
    const matchSearch =
      t.firstName.toLowerCase().includes(q) ||
      t.lastName.toLowerCase().includes(q)  ||
      t.email.toLowerCase().includes(q);
    const matchPageant = filterPageant === "all" || t.pageantId === filterPageant;
    return matchSearch && matchPageant;
  });

  // ── Table columns ─────────────────────────────────────────────────────────
  const COLUMNS: OrgTableColumn<TabulatorRow>[] = [
    {
      key: "tabulator",
      header: "Tabulator",
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
        <span
          className="inline-flex items-center h-5 px-2 text-[10px] font-medium bg-navy/8 border border-navy/15 text-navy truncate max-w-[180px]"
          title={row.pageantName}
        >
          {row.pageantName}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <OrgBadge variant={row.isActive ? "success" : "muted"}>
          {row.isActive ? "Active" : "Deactivated"}
        </OrgBadge>
      ),
      cellClass: "w-28",
    },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <div className="flex items-center justify-end">
          {row.isActive ? <Button variant="danger" size="sm" onClick={() => { setRemoveAction("deactivate"); setRemoveTarget(row); }}>Deactivate</Button>
            : <Button variant="secondary" size="sm" onClick={() => { setRemoveAction("activate"); setRemoveTarget(row); }}>Activate</Button>}
          <Button variant="danger" size="sm" onClick={() => { setRemoveAction("delete"); setRemoveTarget(row); }}>Delete</Button>
        </div>
      ),
      cellClass: "w-28",
    },
  ];

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <OrgPageShell
      title="Tabulators"
      subtitle="All tabulators assigned across your pageants."
      breadcrumbs={[
        { label: "Dashboard", href: "/org_owner/dashboard" },
        { label: "Teams" },
        { label: "Tabulators" },
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
              <option value="">— Select pageant to add tabulator —</option>
              {pageants.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
          {selectedPageantId && (
            <Button variant="secondary" size="sm" onClick={openAdd}>
              + Add Tabulator
            </Button>
          )}
        </div>
      }
    >
      {/* Fan-out fetchers */}
      {pageants.map(p => (
        <TabulatorFetcher key={p.id} orgId={orgId} pageant={p} onLoaded={handleTabsLoaded} />
      ))}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total"    value={allLoaded ? allTabulators.length : "—"} sub="across all pageants" />
        <StatCard label="Active"   value={allLoaded ? activeCount : "—"}          sub={allLoaded ? `of ${allTabulators.length} total` : ""} />
        <StatCard label="Inactive" value={allLoaded ? inactiveCount : "—"}        sub="removed or inactive" />
        <StatCard label="Plan limit" value={usageLoading ? "—" : planUsage?.planName == null ? "No active plan" : `${planUsage.tabulatorUsersUsed} / ${planUsage.maxTabulatorUsers ?? "∞"}`} sub={planUsage?.planName == null ? "Choose a plan to view limits" : planUsage.maxTabulatorUsers == null ? "Unlimited tabulator accounts" : `${Math.max(0, planUsage.maxTabulatorUsers - planUsage.tabulatorUsersUsed)} remaining`} />
      </div>

      {/* Loading */}
      {!allLoaded && (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14" />)}
        </div>
      )}

      {/* Content */}
      {allLoaded && (
        <>
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
              icon={<TabulatorIcon />}
              heading={search || filterPageant !== "all" ? "No tabulators found" : "No tabulators assigned yet"}
              description={
                search || filterPageant !== "all"
                  ? "Try adjusting your search or filter."
                  : "Go to a pageant's Staff page to assign tabulators."
              }
            />
          ) : (
            <>
              <OrgDataTable
                columns={COLUMNS}
                data={filtered}
                keyExtractor={r => `${r.pageantId}-${r.userId}`}
              />
              <p className="text-caption text-muted mt-3">
                Showing {filtered.length} of {allTabulators.length} tabulator{allTabulators.length !== 1 ? "s" : ""}
              </p>
            </>
          )}
        </>
      )}

      {/* Add tabulator modal */}
      <Modal
        open={showAdd}
        onClose={closeAdd}
        title="Add Tabulator"
        description={`Assign a tabulator to ${selectedPageant?.name ?? "this pageant"}.`}
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={closeAdd} disabled={addForm.formState.isSubmitting}>
              Cancel
            </Button>
            <Button variant="secondary" size="sm" form="add-tab-form" type="submit" loading={addForm.formState.isSubmitting}>
              Add Tabulator
            </Button>
          </>
        }
      >
        <form id="add-tab-form" onSubmit={addForm.handleSubmit((data) => onAdd(data))} noValidate className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={<>First Name <span className="text-error">*</span></>} error={addForm.formState.errors.firstName?.message}>
              <input type="text" placeholder="Ana" autoComplete="given-name" className={fieldInput} {...addForm.register("firstName")} />
            </Field>
            <Field label={<>Last Name <span className="text-error">*</span></>} error={addForm.formState.errors.lastName?.message}>
              <input type="text" placeholder="Reyes" autoComplete="family-name" className={fieldInput} {...addForm.register("lastName")} />
            </Field>
          </div>
          <Field
            label={<>Email Address <span className="text-error">*</span></>}
            error={addForm.formState.errors.email?.message}
            hint="Each email can have one staff role: judge or tabulator. Existing accounts are linked; new accounts receive credentials by email."
          >
            <input type="email" placeholder="tabulator@example.com" autoComplete="email" className={fieldInput} {...addForm.register("email")} />
          </Field>
          {confirmReuse ? <div className="space-y-3 border border-amber-300/50 bg-amber-50 p-4 text-small text-amber-950" role="alert"><p>This account is already a tabulator for another organization. Use its existing login and password here? No new account or password email will be created.</p><div className="flex gap-2"><Button variant="secondary" size="sm" onClick={() => void onAdd(addForm.getValues(), true)} loading={assignMutation.isPending}>Use existing account</Button><Button variant="ghost" size="sm" onClick={() => setConfirmReuse(false)} disabled={assignMutation.isPending}>Cancel</Button></div></div> : null}
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
        title={removeAction === "delete" ? "Delete tabulator assignment permanently?" : `${removeAction === "activate" ? "Activate" : "Deactivate"} tabulator?`}
        description={
          removeTarget
            ? removeAction === "delete" ? `Permanently delete ${removeTarget.firstName} ${removeTarget.lastName}'s assignment in "${removeTarget.pageantName}"? Their account and other assignments remain.` : `${removeAction === "activate" ? "Restore" : "Remove"} ${removeTarget.firstName} ${removeTarget.lastName}'s access in "${removeTarget.pageantName}"?`
            : ""
        }
        confirmLabel={removeAction === "delete" ? "Delete assignment" : removeAction === "activate" ? "Activate" : "Deactivate"}
        loading={rowRevokeMutation.isPending || deactivateMutation.isPending || deleteMutation.isPending}
        destructive
      />

    </OrgPageShell>
  );
}
