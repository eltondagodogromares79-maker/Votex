"use client";

import { use, useState } from "react";
import Link from "next/link";
import OrgPageShell from "@/src/features/org_owner/components/OrgPageShell";
import { Modal, ConfirmModal } from "@/src/components/ui/Modal";
import { Button } from "@/src/components/ui/Button";
import { useSession } from "@/src/features/auth/context/SessionContext";
import { usePageant } from "@/src/features/org_owner/hooks/usePageants";
import {
  useVotePackages,
  useCreateVotePackage,
  useUpdateVotePackage,
  useDeactivateVotePackage,
} from "@/src/features/org_owner/hooks/useVotePackages";
import type {
  VotePackageResponse,
  CreateVotePackageRequest,
  UpdateVotePackageRequest,
} from "@/src/types";

// ─── Design tokens (match login/register palette for modals) ──────────────────

const LBL =
  "block text-small font-medium text-white/80 mb-1.5";
const INP =
  "w-full h-10 px-3 bg-white/8 border border-white/15 text-white text-small " +
  "placeholder:text-white/30 focus:outline-none focus:border-gold/60 transition-colors duration-150";
const TXT =
  "w-full px-3 py-2.5 bg-white/8 border border-white/15 text-white text-small " +
  "placeholder:text-white/30 focus:outline-none focus:border-gold/60 transition-colors duration-150 resize-none";

// ─── Package form ─────────────────────────────────────────────────────────────

interface PkgForm {
  name: string;
  description: string;
  voteQuantity: string;
  priceAmount: string;
  currency: string;
}

const EMPTY: PkgForm = { name: "", description: "", voteQuantity: "", priceAmount: "", currency: "PHP" };

function fromResponse(p: VotePackageResponse): PkgForm {
  return {
    name: p.name,
    description: p.description ?? "",
    voteQuantity: String(p.voteQuantity),
    priceAmount: p.priceAmount,
    currency: p.currency,
  };
}

function validate(f: PkgForm): string | null {
  if (!f.name.trim()) return "Package name is required.";
  const qty = parseInt(f.voteQuantity, 10);
  if (!f.voteQuantity || isNaN(qty) || qty < 1) return "Vote quantity must be at least 1.";
  if (!f.priceAmount.trim() || isNaN(parseFloat(f.priceAmount))) return "Enter a valid price.";
  return null;
}

function PackageForm({
  form,
  onChange,
  error,
}: {
  form: PkgForm;
  onChange: (f: PkgForm) => void;
  error: string | null;
}) {
  const set =
    (k: keyof PkgForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange({ ...form, [k]: e.target.value });

  return (
    <div className="space-y-4">
      <div>
        <label className={LBL}>Package Name <span className="text-gold">*</span></label>
        <input className={INP} placeholder="e.g. Bronze Pack" maxLength={120}
          value={form.name} onChange={set("name")} />
      </div>

      <div>
        <label className={LBL}>Description</label>
        <textarea className={TXT} placeholder="Optional short description…" rows={3}
          value={form.description} onChange={set("description")} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={LBL}>Vote Quantity <span className="text-gold">*</span></label>
          <input type="number" min={1} step={1} className={INP} placeholder="e.g. 100"
            value={form.voteQuantity} onChange={set("voteQuantity")} />
        </div>
        <div>
          <label className={LBL}>Price <span className="text-gold">*</span></label>
          <input type="text" inputMode="decimal" className={INP} placeholder="e.g. 50.00"
            value={form.priceAmount} onChange={set("priceAmount")} />
        </div>
      </div>

      <div>
        <label className={LBL}>Currency</label>
        <input className={INP} placeholder="PHP" maxLength={10}
          value={form.currency} onChange={set("currency")} />
        <p className="text-caption text-white/35 mt-1.5">Defaults to PHP if left blank.</p>
      </div>

      {error && (
        <p className="text-caption text-error bg-error/10 border border-error/20 px-3 py-2">
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Row ──────────────────────────────────────────────────────────────────────

function PackageRow({
  pkg,
  onEdit,
  onDeactivate,
}: {
  pkg: VotePackageResponse;
  onEdit: (p: VotePackageResponse) => void;
  onDeactivate: (p: VotePackageResponse) => void;
}) {
  return (
    <div className={`flex items-center gap-4 px-5 py-4 border-b border-border/60 last:border-b-0 transition-colors ${
      pkg.isActive ? "bg-surface hover:bg-slate/30" : "bg-surface/50 opacity-60"
    }`}>
      {/* Status dot */}
      <span className={`w-2 h-2 rounded-full shrink-0 ${pkg.isActive ? "bg-success" : "bg-border"}`} />

      {/* Name + description */}
      <div className="flex-1 min-w-0">
        <p className="text-small font-semibold text-charcoal truncate">{pkg.name}</p>
        {pkg.description && (
          <p className="text-caption text-muted mt-0.5 truncate">{pkg.description}</p>
        )}
      </div>

      {/* Votes */}
      <div className="hidden sm:block w-28 shrink-0 text-right">
        <p className="text-small text-charcoal font-medium tabular-nums">
          {pkg.voteQuantity.toLocaleString()}
        </p>
        <p className="text-caption text-muted">votes</p>
      </div>

      {/* Price */}
      <div className="w-24 shrink-0 text-right">
        <p className="text-small font-semibold text-charcoal tabular-nums">
          {pkg.currency}&nbsp;{parseFloat(pkg.priceAmount).toFixed(2)}
        </p>
        <p className="text-caption text-muted hidden sm:block">per pack</p>
      </div>

      {/* Status badge */}
      <div className="hidden md:block w-20 shrink-0 text-right">
        <span className={`inline-flex items-center h-5 px-2 text-[10px] font-semibold uppercase tracking-wider border ${
          pkg.isActive
            ? "bg-success/8 border-success/25 text-success"
            : "bg-border/30 border-border text-muted"
        }`}>
          {pkg.isActive ? "Active" : "Inactive"}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onEdit(pkg)}
          className="h-8 w-8 flex items-center justify-center text-muted hover:text-navy hover:bg-navy/8 transition-colors"
          aria-label="Edit package"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
          </svg>
        </button>
        {pkg.isActive && (
          <button
            onClick={() => onDeactivate(pkg)}
            className="h-8 w-8 flex items-center justify-center text-muted hover:text-error hover:bg-error/8 transition-colors"
            aria-label="Deactivate package"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function VotePackagesPage({
  params,
}: {
  params: Promise<{ pageantId: string }>;
}) {
  const { pageantId } = use(params);
  const { currentUser } = useSession();
  const orgId = currentUser?.organizationId ?? "";

  const { data: pageant } = usePageant(orgId, pageantId);
  const { data: packages = [], isLoading } = useVotePackages(orgId, pageantId);

  const createMut    = useCreateVotePackage(orgId, pageantId);
  const deactivateMut = useDeactivateVotePackage(orgId, pageantId);

  // modal state
  const [addOpen,          setAddOpen]          = useState(false);
  const [editTarget,       setEditTarget]        = useState<VotePackageResponse | null>(null);
  const [deactivateTarget, setDeactivateTarget]  = useState<VotePackageResponse | null>(null);

  // form state
  const [addForm,  setAddForm]  = useState<PkgForm>(EMPTY);
  const [editForm, setEditForm] = useState<PkgForm>(EMPTY);
  const [formErr,  setFormErr]  = useState<string | null>(null);

  const updateMut = useUpdateVotePackage(orgId, pageantId, editTarget?.id ?? "");

  // handlers
  function openAdd() {
    setAddForm(EMPTY);
    setFormErr(null);
    setAddOpen(true);
  }

  function openEdit(pkg: VotePackageResponse) {
    setEditForm(fromResponse(pkg));
    setFormErr(null);
    setEditTarget(pkg);
  }

  async function handleAdd() {
    const err = validate(addForm);
    if (err) { setFormErr(err); return; }
    setFormErr(null);
    const payload: CreateVotePackageRequest = {
      name:         addForm.name.trim(),
      description:  addForm.description.trim() || null,
      voteQuantity: parseInt(addForm.voteQuantity, 10),
      priceAmount:  addForm.priceAmount.trim(),
      currency:     addForm.currency.trim() || "PHP",
    };
    await createMut.mutateAsync(payload);
    setAddOpen(false);
    setAddForm(EMPTY);
  }

  async function handleEdit() {
    const err = validate(editForm);
    if (err) { setFormErr(err); return; }
    setFormErr(null);
    const payload: UpdateVotePackageRequest = {
      name:         editForm.name.trim(),
      description:  editForm.description.trim() || null,
      voteQuantity: parseInt(editForm.voteQuantity, 10),
      priceAmount:  editForm.priceAmount.trim(),
      currency:     editForm.currency.trim() || "PHP",
    };
    await updateMut.mutateAsync(payload);
    setEditTarget(null);
  }

  async function handleDeactivate() {
    if (!deactivateTarget) return;
    await deactivateMut.mutateAsync(deactivateTarget.id);
    setDeactivateTarget(null);
  }

  const pageantName = pageant?.name ?? "Pageant";
  const activeCount = packages.filter(p => p.isActive).length;

  return (
    <OrgPageShell
      title="Vote Packages"
      subtitle={pageantName}
      breadcrumbs={[
        { label: "Pageants",   href: "/org_owner/pageants" },
        { label: pageantName,  href: `/org_owner/pageants/${pageantId}` },
        { label: "Vote Packages" },
      ]}
      action={
        <div className="flex items-center gap-2">
          <Link
            href={`/org_owner/pageants/${pageantId}`}
            className="inline-flex items-center gap-2 h-9 px-4 bg-surface border border-border text-charcoal text-small font-medium hover:border-navy/50 hover:text-navy transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back
          </Link>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 h-9 px-4 bg-navy text-white text-small font-medium hover:bg-navy/90 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.25} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Package
          </button>
        </div>
      }
    >

      {/* ── Summary strip ────────────────────────────────────────────────── */}
      {packages.length > 0 && (
        <p className="text-caption text-muted mb-4">
          {activeCount} active · {packages.length} total package{packages.length !== 1 ? "s" : ""}
        </p>
      )}

      {/* ── Loading ──────────────────────────────────────────────────────── */}
      {isLoading && (
        <div className="border border-border bg-surface overflow-hidden">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-14 border-b border-border/60 last:border-b-0 animate-pulse bg-surface" />
          ))}
        </div>
      )}

      {/* ── Empty state ──────────────────────────────────────────────────── */}
      {!isLoading && packages.length === 0 && (
        <div className="border border-border bg-surface">
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <svg className="w-10 h-10 text-border mb-4" fill="none" stroke="currentColor" strokeWidth={1.25} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
            </svg>
            <p className="text-small font-semibold text-charcoal mb-1">No vote packages yet</p>
            <p className="text-caption text-muted mb-6 max-w-xs leading-relaxed">
              Add packages so your audience can purchase votes to support their favourite contestants.
            </p>
            <button
              onClick={openAdd}
              className="inline-flex items-center gap-2 h-9 px-5 bg-navy text-white text-small font-medium hover:bg-navy/90 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.25} viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add First Package
            </button>
          </div>
        </div>
      )}

      {/* ── Package list ─────────────────────────────────────────────────── */}
      {!isLoading && packages.length > 0 && (
        <div className="border border-border bg-surface overflow-hidden">
          {/* Column headers */}
          <div className="flex items-center gap-4 px-5 py-2.5 border-b border-border bg-slate/40">
            <div className="w-2 shrink-0" />
            <p className="flex-1 text-caption text-muted uppercase tracking-[0.08em]">Package</p>
            <p className="hidden sm:block w-28 text-right text-caption text-muted uppercase tracking-[0.08em]">Qty</p>
            <p className="w-24 text-right text-caption text-muted uppercase tracking-[0.08em]">Price</p>
            <p className="hidden md:block w-20 text-right text-caption text-muted uppercase tracking-[0.08em]">Status</p>
            <div className="w-[4.5rem] shrink-0" />
          </div>

          {packages.map(pkg => (
            <PackageRow
              key={pkg.id}
              pkg={pkg}
              onEdit={openEdit}
              onDeactivate={setDeactivateTarget}
            />
          ))}
        </div>
      )}

      {/* ── Add modal ────────────────────────────────────────────────────── */}
      <Modal
        open={addOpen}
        onClose={() => { setAddOpen(false); setFormErr(null); }}
        title="Add Vote Package"
        description="New package for this pageant."
        size="md"
        footer={
          <>
            <Button variant="ghost" size="sm"
              onClick={() => { setAddOpen(false); setFormErr(null); }}
              disabled={createMut.isPending}>
              Cancel
            </Button>
            <Button variant="secondary" size="sm" onClick={handleAdd} loading={createMut.isPending}>
              Create
            </Button>
          </>
        }
      >
        <PackageForm form={addForm} onChange={setAddForm} error={formErr} />
      </Modal>

      {/* ── Edit modal ───────────────────────────────────────────────────── */}
      <Modal
        open={editTarget !== null}
        onClose={() => { setEditTarget(null); setFormErr(null); }}
        title="Edit Package"
        description={editTarget?.name}
        size="md"
        footer={
          <>
            <Button variant="ghost" size="sm"
              onClick={() => { setEditTarget(null); setFormErr(null); }}
              disabled={updateMut.isPending}>
              Cancel
            </Button>
            <Button variant="secondary" size="sm" onClick={handleEdit} loading={updateMut.isPending}>
              Save Changes
            </Button>
          </>
        }
      >
        <PackageForm form={editForm} onChange={setEditForm} error={formErr} />
      </Modal>

      {/* ── Deactivate confirm ───────────────────────────────────────────── */}
      <ConfirmModal
        open={deactivateTarget !== null}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={handleDeactivate}
        title="Deactivate Package"
        description={`"${deactivateTarget?.name}" will no longer be available for purchase. This can't be undone from the dashboard.`}
        confirmLabel="Deactivate"
        loading={deactivateMut.isPending}
        destructive
      />

    </OrgPageShell>
  );
}
