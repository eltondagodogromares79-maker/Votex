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
  useCoordinators,
  useAddCoordinator,
  useUpdateCoordinator,
  useRemoveCoordinator,
  useResendCoordinatorCredentials,
} from "@/src/features/org_owner/hooks/useCoordinators";
import { usePageantCoordinators } from "@/src/features/org_owner/hooks/usePageantStaff";
import { useToast } from "@/src/components/ui/Toast";
import { ApiError } from "@/src/lib/api/client";
import type { CoordinatorResponse, PageantResponse } from "@/src/types";

// ─── Schemas ─────────────────────────────────────────────────────────────────

const addSchema = z.object({
  email:     z.string().min(1, "Email is required").email("Enter a valid email"),
  firstName: z.string().min(1, "First name is required").max(100),
  lastName:  z.string().min(1, "Last name is required").max(100),
});

const editSchema = z.object({
  email:     z.string().min(1, "Email is required").email("Enter a valid email"),
  firstName: z.string().min(1, "First name is required").max(100),
  lastName:  z.string().min(1, "Last name is required").max(100),
});

type AddFormValues  = z.infer<typeof addSchema>;
type EditFormValues = z.infer<typeof editSchema>;

// ─── Design tokens — auth page palette ───────────────────────────────────────

const fieldLabel = "block text-small font-medium text-white/80 mb-1.5";
const fieldInput = "w-full h-10 px-3 bg-white/8 border border-white/15 text-white text-small placeholder:text-white/30 focus:outline-none focus:border-gold/60 transition-colors duration-150";
const fieldError = "text-caption text-error mt-1";

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

function CoordinatorIcon() {
  return (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.25} viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}

// ─── Field component ──────────────────────────────────────────────────────────

function Field({ label, error, children, hint }: { label: React.ReactNode; error?: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className={fieldLabel}>{label}</label>
      {children}
      {error && <p className={fieldError}>{error}</p>}
      {!error && hint && <p className="text-caption text-white/40 mt-1">{hint}</p>}
    </div>
  );
}

// ─── Per-pageant coordinator fetcher (fan-out) ────────────────────────────────

/**
 * Fetches coordinators for one pageant and calls onLoaded when ready.
 * Rendered as an invisible component so we can fan-out N queries via
 * usePageantCoordinators (which is already memoised in React Query).
 */
function PageantCoordFetcher({
  orgId,
  pageant,
  onLoaded,
}: {
  orgId: string;
  pageant: PageantResponse;
  onLoaded: (pageantId: string, pageantName: string, userIds: string[]) => void;
}) {
  const { data } = usePageantCoordinators(orgId, pageant.id);
  useEffect(() => {
    if (data) onLoaded(pageant.id, pageant.name, data.map(c => c.userId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);
  return null;
}



export default function CoordinatorsPage() {
  const { currentUser } = useSession();
  const orgId = currentUser?.organizationId ?? "";
  const { toast } = useToast();

  // ── Data hooks ────────────────────────────────────────────────────────────
  const { data: coordinators = [], isLoading, isError, refetch } = useCoordinators(orgId);
  const { data: pageants = [] } = usePageants(orgId);
  const addMutation    = useAddCoordinator(orgId);
  const removeMutation = useRemoveCoordinator(orgId);
  const resendMutation = useResendCoordinatorCredentials(orgId);

  // ── Pageant assignment map: userId → pageant names ────────────────────────
  // Built incrementally as PageantCoordFetcher components report back.
  const [assignmentMap, setAssignmentMap] = useState<Map<string, string[]>>(new Map());

  function handleCoordLoaded(pageantId: string, pageantName: string, userIds: string[]) {
    setAssignmentMap(prev => {
      const next = new Map(prev);
      // Remove this pageant from all existing entries first (handles re-fetches)
      for (const [uid, names] of next) {
        next.set(uid, names.filter(n => n !== pageantName));
      }
      // Add this pageant for each assigned coordinator
      for (const uid of userIds) {
        const existing = next.get(uid) ?? [];
        if (!existing.includes(pageantName)) next.set(uid, [...existing, pageantName]);
      }
      return next;
    });
  }

  // ── Modal state ───────────────────────────────────────────────────────────
  const [search,       setSearch]       = useState("");
  const [showAdd,      setShowAdd]      = useState(false);
  const [editTarget,   setEditTarget]   = useState<CoordinatorResponse | null>(null);
  const [removeTarget, setRemoveTarget] = useState<CoordinatorResponse | null>(null);

  // ── Update hook is keyed by userId — created when editTarget changes ──────
  const updateMutation = useUpdateCoordinator(orgId, editTarget?.userId ?? "");

  // ── Add form ──────────────────────────────────────────────────────────────
  const addForm = useForm<AddFormValues>({ resolver: zodResolver(addSchema) });

  function openAdd() { addForm.reset(); setShowAdd(true); }
  function closeAdd() { setShowAdd(false); addForm.reset(); }

  async function onAdd(data: AddFormValues) {
    try {
      await addMutation.mutateAsync(data);
      toast.success(`${data.firstName} ${data.lastName} added as coordinator.`);
      closeAdd();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.userMessage : "Failed to add coordinator.");
    }
  }

  // ── Edit form ─────────────────────────────────────────────────────────────
  const editForm = useForm<EditFormValues>({ resolver: zodResolver(editSchema) });

  function openEdit(coordinator: CoordinatorResponse) {
    editForm.reset({
      email:     coordinator.email,
      firstName: coordinator.firstName,
      lastName:  coordinator.lastName,
    });
    setEditTarget(coordinator);
  }

  function closeEdit() { setEditTarget(null); editForm.reset(); }

  async function onEdit(data: EditFormValues) {
    try {
      await updateMutation.mutateAsync(data);
      toast.success("Coordinator updated.");
      closeEdit();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.userMessage : "Failed to update coordinator.");
    }
  }

  // ── Remove ────────────────────────────────────────────────────────────────
  async function onConfirmRemove() {
    if (!removeTarget) return;
    try {
      await removeMutation.mutateAsync(removeTarget.userId);
      toast.success(`${removeTarget.firstName} ${removeTarget.lastName} removed.`);
      setRemoveTarget(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.userMessage : "Failed to remove coordinator.");
    }
  }

  // ── Resend credentials ────────────────────────────────────────────────────
  async function onResend(coordinator: CoordinatorResponse) {
    try {
      await resendMutation.mutateAsync(coordinator.userId);
      toast.success(`New credentials sent to ${coordinator.email}.`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.userMessage : "Failed to send credentials.");
    }
  }

  // ── Derived stats ─────────────────────────────────────────────────────────
  const activeCount   = coordinators.filter((c) => c.isActive).length;
  const inactiveCount = coordinators.length - activeCount;

  // ── Filter ────────────────────────────────────────────────────────────────
  const filtered = coordinators.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.firstName.toLowerCase().includes(q) ||
      c.lastName.toLowerCase().includes(q)  ||
      c.email.toLowerCase().includes(q)
    );
  });

  // ── Table columns ─────────────────────────────────────────────────────────
  const COLUMNS: OrgTableColumn<CoordinatorResponse>[] = [
    {
      key: "coordinator",
      header: "Coordinator",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-navy flex items-center justify-center shrink-0">
            <span className="font-serif font-bold text-gold text-caption leading-none">
              {row.firstName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-small font-semibold text-charcoal leading-tight">
              {row.firstName} {row.lastName}
            </p>
            <p className="text-caption text-muted">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (row) => (
        <OrgBadge variant="navy">
          {row.role.replace("ORG_", "").replace(/_/g, " ")}
        </OrgBadge>
      ),
      hideOnMobile: true,
    },
    {
      key: "pageants",
      header: "Assigned Pageants",
      hideOnMobile: true,
      render: (row) => {
        const names = assignmentMap.get(row.userId) ?? [];
        if (names.length === 0) {
          return <span className="text-caption text-muted italic">None</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {names.map(name => (
              <span
                key={name}
                className="inline-flex items-center h-5 px-2 text-[10px] font-medium bg-navy/8 border border-navy/15 text-navy truncate max-w-[160px]"
                title={name}
              >
                {name}
              </span>
            ))}
          </div>
        );
      },
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
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => openEdit(row)}>
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onResend(row)}
            disabled={resendMutation.isPending}
          >
            Resend
          </Button>
          <Button variant="danger" size="sm" onClick={() => setRemoveTarget(row)}>
            Remove
          </Button>
        </div>
      ),
      cellClass: "w-56",
    },
  ];

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <OrgPageShell
      title="Coordinators"
      subtitle="Coordinators manage specific pageant events on your behalf."
      breadcrumbs={[
        { label: "Dashboard", href: "/org_owner/dashboard" },
        { label: "Teams" },
        { label: "Coordinators" },
      ]}
      action={
        <Button variant="secondary" size="sm" onClick={openAdd}>
          + Add Coordinator
        </Button>
      }
    >

      {/* ── Stat cards — responsive: 1 col mobile → 3 col sm ──────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Total"    value={isLoading ? "—" : coordinators.length} sub="organization coordinators" />
        <StatCard label="Active"   value={isLoading ? "—" : activeCount}         sub={isLoading ? "" : `of ${coordinators.length} total`} />
        <StatCard label="Inactive" value={isLoading ? "—" : inactiveCount}       sub="pending or removed" />
      </div>

      {/* ── Error ──────────────────────────────────────────────────────── */}
      {isError && (
        <div className="bg-error/8 border border-error/20 px-4 py-4 mb-6">
          <p className="text-small font-semibold text-error">Unable to load coordinators.</p>
          <button onClick={() => refetch()} className="mt-1 text-caption font-medium text-navy hover:underline">
            Try again
          </button>
        </div>
      )}

      {/* ── Loading ────────────────────────────────────────────────────── */}
      {isLoading && (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14" />)}
        </div>
      )}

      {/* ── Content ────────────────────────────────────────────────────── */}
      {!isLoading && !isError && (
        <>
          <div className="relative max-w-sm mb-5">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none"
              fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text" placeholder="Search by name or email…" value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 bg-surface border border-border text-small text-charcoal placeholder:text-muted focus:outline-none focus:border-navy transition-colors"
            />
          </div>

          {filtered.length === 0 ? (
            <OrgEmptyState
              icon={<CoordinatorIcon />}
              heading={search ? `No results for "${search}"` : "No coordinators yet"}
              description={search ? "Try a different name or email." : "Add your first coordinator to assign them to a pageant."}
              action={!search ? <Button variant="secondary" size="sm" onClick={openAdd}>+ Add Coordinator</Button> : undefined}
            />
          ) : (
            <>
              <OrgDataTable columns={COLUMNS} data={filtered} keyExtractor={(r) => r.userId} />
              <p className="text-caption text-muted mt-3">
                Showing {filtered.length} of {coordinators.length} coordinator{coordinators.length !== 1 ? "s" : ""}
              </p>
            </>
          )}
        </>
      )}

      {/* ── Fan-out: fetch coordinators per pageant to build assignment map ── */}
      {pageants.map(p => (
        <PageantCoordFetcher
          key={p.id}
          orgId={orgId}
          pageant={p}
          onLoaded={handleCoordLoaded}
        />
      ))}

      {/* ═══════════════════════════════════════════════════════════════
          ADD COORDINATOR MODAL
      ═══════════════════════════════════════════════════════════════ */}
      <Modal
        open={showAdd}
        onClose={closeAdd}
        title="Add Coordinator"
        description="Create a new coordinator account or link an existing user."
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={closeAdd} disabled={addForm.formState.isSubmitting}>
              Cancel
            </Button>
            <Button
              variant="secondary" size="sm"
              form="add-coordinator-form" type="submit"
              loading={addForm.formState.isSubmitting}
            >
              Add Coordinator
            </Button>
          </>
        }
      >
        <form id="add-coordinator-form" onSubmit={addForm.handleSubmit(onAdd)} noValidate className="space-y-5">

          {/* Name row */}
          <div className="grid grid-cols-2 gap-4">
            <Field label={<>First Name <span className="text-error">*</span></>} error={addForm.formState.errors.firstName?.message}>
              <input id="add-first" type="text" placeholder="Juan" autoComplete="given-name"
                className={fieldInput} {...addForm.register("firstName")} />
            </Field>
            <Field label={<>Last Name <span className="text-error">*</span></>} error={addForm.formState.errors.lastName?.message}>
              <input id="add-last" type="text" placeholder="dela Cruz" autoComplete="family-name"
                className={fieldInput} {...addForm.register("lastName")} />
            </Field>
          </div>

          {/* Email */}
          <Field
            label={<>Email Address <span className="text-error">*</span></>}
            error={addForm.formState.errors.email?.message}
            hint="An existing account with this email will be linked. Otherwise a new account is created and credentials are emailed automatically."
          >
            <input id="add-email" type="email" placeholder="coordinator@example.com" autoComplete="email"
              className={fieldInput} {...addForm.register("email")} />
          </Field>

          {/* Info notice */}
          <div className="flex gap-3 bg-white/5 border border-white/15 px-4 py-3">
            <svg className="w-4 h-4 text-gold/70 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
            <p className="text-caption text-white/50 leading-relaxed">
              A temporary 8-character password will be generated and emailed to the coordinator. They should change it after their first login.
            </p>
          </div>

        </form>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════════
          EDIT COORDINATOR MODAL
      ═══════════════════════════════════════════════════════════════ */}
      <Modal
        open={!!editTarget}
        onClose={closeEdit}
        title="Edit Coordinator"
        description={editTarget ? `Editing ${editTarget.firstName} ${editTarget.lastName}` : ""}
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={closeEdit} disabled={editForm.formState.isSubmitting}>
              Cancel
            </Button>
            <Button
              variant="secondary" size="sm"
              form="edit-coordinator-form" type="submit"
              loading={editForm.formState.isSubmitting}
            >
              Save Changes
            </Button>
          </>
        }
      >
        <form id="edit-coordinator-form" onSubmit={editForm.handleSubmit(onEdit)} noValidate className="space-y-5">

          <div className="grid grid-cols-2 gap-4">
            <Field label={<>First Name <span className="text-error">*</span></>} error={editForm.formState.errors.firstName?.message}>
              <input type="text" placeholder="Juan" autoComplete="given-name"
                className={fieldInput} {...editForm.register("firstName")} />
            </Field>
            <Field label={<>Last Name <span className="text-error">*</span></>} error={editForm.formState.errors.lastName?.message}>
              <input type="text" placeholder="dela Cruz" autoComplete="family-name"
                className={fieldInput} {...editForm.register("lastName")} />
            </Field>
          </div>

          <Field
            label={<>Email Address <span className="text-error">*</span></>}
            error={editForm.formState.errors.email?.message}
            hint="Changing the email updates the coordinator's login address."
          >
            <input type="email" placeholder="coordinator@example.com" autoComplete="email"
              className={fieldInput} {...editForm.register("email")} />
          </Field>

        </form>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════════
          REMOVE CONFIRM MODAL
      ═══════════════════════════════════════════════════════════════ */}
      <ConfirmModal
        open={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        onConfirm={onConfirmRemove}
        title="Remove Coordinator"
        description={
          removeTarget
            ? `Remove ${removeTarget.firstName} ${removeTarget.lastName} (${removeTarget.email}) as coordinator? They will lose access to all assigned pageants in this organization.`
            : ""
        }
        confirmLabel="Remove"
        loading={removeMutation.isPending}
        destructive
      />

    </OrgPageShell>
  );
}
