"use client";

import { useState } from "react";
import AdminPageShell from "@/src/features/admin/components/AdminPageShell";
import { Modal, ConfirmModal } from "@/src/components/ui/Modal";
import { Button } from "@/src/components/ui/Button";
import {
  useSubscriptionPlans,
  useCreateSubscriptionPlan,
  useUpdateSubscriptionPlan,
  useDeactivateSubscriptionPlan,
} from "@/src/features/admin/hooks/useSubscriptionPlans";
import type { SubscriptionPlanResponse, SubscriptionPlanRequest, SubscriptionPlanKind } from "@/src/types";

// ─── Tokens ───────────────────────────────────────────────────────────────────

const LBL = "block text-small font-medium text-white/80 mb-1.5";
const INP =
  "w-full h-10 px-3 bg-white/8 border border-white/15 text-white text-small " +
  "placeholder:text-white/30 focus:outline-none focus:border-gold/60 transition-colors duration-150";
const SEL =
  "w-full h-10 px-3 bg-white/8 border border-white/15 text-white text-small " +
  "focus:outline-none focus:border-gold/60 transition-colors duration-150";

const KIND_LABELS: Record<string, string> = {
  ONE_TIME: "One Time",
  PREMIUM:  "Premium",
  CUSTOM:   "Custom",
};

const KIND_STYLES: Record<string, string> = {
  ONE_TIME: "bg-success/20 border-success/40 text-success",
  PREMIUM:  "bg-gold/10 border-gold/30 text-gold",
  CUSTOM:   "bg-slate/10 border-slate/40 text-slate",
};

// ─── Form ─────────────────────────────────────────────────────────────────────

interface PlanForm {
  code: string; name: string; kind: SubscriptionPlanKind;
  priceAmount: string; currency: string;
  billingIntervalMonths: string;
  maxPageants: string; maxTabulatorUsers: string;
  maxJudgesPerPageant: string; maxRoundsPerPageant: string; maxCategoriesPerRound: string;
  publicVotingEnabled: boolean; customizationEnabled: boolean; isActive: boolean;
}

const EMPTY: PlanForm = {
  code: "", name: "", kind: "ONE_TIME",
  priceAmount: "0.00", currency: "PHP",
  billingIntervalMonths: "",
  maxPageants: "", maxTabulatorUsers: "",
  maxJudgesPerPageant: "", maxRoundsPerPageant: "", maxCategoriesPerRound: "",
  publicVotingEnabled: true, customizationEnabled: false, isActive: true,
};

function fromPlan(p: SubscriptionPlanResponse): PlanForm {
  return {
    code: p.code, name: p.name, kind: p.kind,
    priceAmount: p.priceAmount, currency: p.currency,
    billingIntervalMonths: p.billingIntervalMonths != null ? String(p.billingIntervalMonths) : "",
    maxPageants: p.maxPageants != null ? String(p.maxPageants) : "",
    maxTabulatorUsers: p.maxTabulatorUsers != null ? String(p.maxTabulatorUsers) : "",
    maxJudgesPerPageant: p.maxJudgesPerPageant != null ? String(p.maxJudgesPerPageant) : "",
    maxRoundsPerPageant: p.maxRoundsPerPageant != null ? String(p.maxRoundsPerPageant) : "",
    maxCategoriesPerRound: p.maxCategoriesPerRound != null ? String(p.maxCategoriesPerRound) : "",
    publicVotingEnabled: p.publicVotingEnabled,
    customizationEnabled: p.customizationEnabled, isActive: p.isActive,
  };
}

function toRequest(f: PlanForm): SubscriptionPlanRequest {
  const num = (s: string) => s.trim() ? parseInt(s) : null;
  return {
    code: f.code.trim().toUpperCase(), name: f.name.trim(), kind: f.kind,
    priceAmount: f.priceAmount.trim(), currency: f.currency.trim().toUpperCase() || "PHP",
    billingIntervalMonths: num(f.billingIntervalMonths),
    maxPageants: num(f.maxPageants), maxTabulatorUsers: num(f.maxTabulatorUsers),
    maxJudgesPerPageant: num(f.maxJudgesPerPageant),
    maxRoundsPerPageant: num(f.maxRoundsPerPageant),
    maxCategoriesPerRound: num(f.maxCategoriesPerRound),
    publicVotingEnabled: f.publicVotingEnabled,
    customizationEnabled: f.customizationEnabled, isActive: f.isActive,
  };
}

function validate(f: PlanForm): string | null {
  if (!f.code.trim()) return "Code is required.";
  if (!f.name.trim()) return "Name is required.";
  if (!f.priceAmount.trim() || isNaN(parseFloat(f.priceAmount))) return "Valid price is required.";
  if (parseFloat(f.priceAmount) < 0) return "Price cannot be negative.";
  return null;
}

// ─── Section label ────────────────────────────────────────────────────────────

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-caption text-white/40 uppercase tracking-[0.1em] mb-3 pb-2 border-b border-white/10">
        {title}
      </p>
      {children}
    </div>
  );
}

// ─── Form fields ──────────────────────────────────────────────────────────────

function PlanFormFields({ form, onChange, error }: {
  form: PlanForm; onChange: (f: PlanForm) => void; error: string | null;
}) {
  const set = (k: keyof PlanForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    onChange({ ...form, [k]: e.target.value });
  const chk = (k: keyof PlanForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...form, [k]: e.target.checked });

  return (
    <div className="space-y-6">

      {/* Identification */}
      <FormSection title="Plan Identity">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LBL}>Code <span className="text-gold">*</span></label>
            <input className={INP} placeholder="BASIC_MONTHLY" value={form.code} onChange={set("code")}
              style={{ textTransform: "uppercase" }} />
            <p className="text-caption text-white/30 mt-1">Uppercase letters, numbers, underscores.</p>
          </div>
          <div>
            <label className={LBL}>Display Name <span className="text-gold">*</span></label>
            <input className={INP} placeholder="Basic Monthly" value={form.name} onChange={set("name")} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label className={LBL}>Billing Kind <span className="text-gold">*</span></label>
            <select className={SEL} value={form.kind} onChange={set("kind")}>
              {(Object.entries(KIND_LABELS) as [SubscriptionPlanKind, string][]).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={LBL}>Currency</label>
            <input className={INP} placeholder="PHP" value={form.currency} onChange={set("currency")} maxLength={3} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label className={LBL}>Price <span className="text-gold">*</span></label>
            <input type="text" inputMode="decimal" className={INP} placeholder="999.00"
              value={form.priceAmount} onChange={set("priceAmount")} />
            <p className="text-caption text-white/30 mt-1">Use 0.00 for free plans.</p>
          </div>
          <div>
            <label className={LBL}>Billing Interval (months)</label>
            <input type="number" min={1} className={INP} placeholder="Leave blank = one-time"
              value={form.billingIntervalMonths} onChange={set("billingIntervalMonths")} />
          </div>
        </div>
      </FormSection>

      {/* Org-level limits */}
      <FormSection title="Organization Limits — leave blank for unlimited">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LBL}>Max Pageants</label>
            <input type="number" min={1} className={INP} placeholder="Unlimited"
              value={form.maxPageants} onChange={set("maxPageants")} />
          </div>
          <div>
            <label className={LBL}>Max Tabulators</label>
            <input type="number" min={1} className={INP} placeholder="Unlimited"
              value={form.maxTabulatorUsers} onChange={set("maxTabulatorUsers")} />
          </div>
        </div>
      </FormSection>

      {/* Per-pageant limits */}
      <FormSection title="Per-Pageant Limits — leave blank for unlimited">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={LBL}>Max Judges</label>
            <input type="number" min={1} className={INP} placeholder="Unlimited"
              value={form.maxJudgesPerPageant} onChange={set("maxJudgesPerPageant")} />
          </div>
          <div>
            <label className={LBL}>Max Rounds</label>
            <input type="number" min={1} className={INP} placeholder="Unlimited"
              value={form.maxRoundsPerPageant} onChange={set("maxRoundsPerPageant")} />
          </div>
          <div>
            <label className={LBL}>Max Categories / Round</label>
            <input type="number" min={1} className={INP} placeholder="Unlimited"
              value={form.maxCategoriesPerRound} onChange={set("maxCategoriesPerRound")} />
          </div>
        </div>
      </FormSection>

      {/* Feature toggles */}
      <FormSection title="Features">
        <div className="space-y-3">
          <label className="flex items-start gap-3 cursor-pointer select-none group">
            <input type="checkbox" className="w-4 h-4 mt-0.5 accent-gold shrink-0"
              checked={form.publicVotingEnabled} onChange={chk("publicVotingEnabled")} />
            <div>
              <p className="text-small text-white/80 group-hover:text-white transition-colors">
                Public voting enabled
              </p>
              <p className="text-caption text-white/35 leading-relaxed">
                Allow audience to purchase vote packages and vote for contestants. Disabling this removes revenue from audience voting.
              </p>
            </div>
          </label>
          <label className="flex items-start gap-3 cursor-pointer select-none group">
            <input type="checkbox" className="w-4 h-4 mt-0.5 accent-gold shrink-0"
              checked={form.customizationEnabled} onChange={chk("customizationEnabled")} />
            <div>
              <p className="text-small text-white/80 group-hover:text-white transition-colors">
                Customization enabled
              </p>
              <p className="text-caption text-white/35 leading-relaxed">
                Allow the organization to customize branding and appearance.
              </p>
            </div>
          </label>
          <label className="flex items-start gap-3 cursor-pointer select-none group">
            <input type="checkbox" className="w-4 h-4 mt-0.5 accent-gold shrink-0"
              checked={form.isActive} onChange={chk("isActive")} />
            <div>
              <p className="text-small text-white/80 group-hover:text-white transition-colors">
                Active (visible to organizations)
              </p>
              <p className="text-caption text-white/35 leading-relaxed">
                Inactive plans are hidden from the subscription selection list.
              </p>
            </div>
          </label>
        </div>
      </FormSection>

      {error && (
        <p className="text-caption text-error bg-error/10 border border-error/20 px-3 py-2">{error}</p>
      )}
    </div>
  );
}

// ─── Limit chip ───────────────────────────────────────────────────────────────

function LimitRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  const isUnlimited = value === "Unlimited";
  return (
    <div className="flex items-center gap-2">
      <span className={`shrink-0 ${isUnlimited ? "text-gold/60" : "text-success/40"}`}>{icon}</span>
      <span className="text-caption text-navy/50 truncate">{label}:</span>
      <span className={`text-caption font-medium ml-auto shrink-0 ${isUnlimited ? "text-gold/80" : "text-success/80"}`}>
        {value}
      </span>
    </div>
  );
}

const CheckIcon = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

const InfinityIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9.75A3.75 3.75 0 0119.5 12a3.75 3.75 0 01-7.5 0 3.75 3.75 0 01-7.5 0 3.75 3.75 0 013.75-3.75c1.035 0 1.97.418 2.651 1.097" />
  </svg>
);

function lim(v: number | null): string {
  return v != null ? String(v) : "Unlimited";
}

// ─── Plan card ────────────────────────────────────────────────────────────────

function PlanCard({
  plan, onEdit, onDeactivate,
}: {
  plan: SubscriptionPlanResponse;
  onEdit: (p: SubscriptionPlanResponse) => void;
  onDeactivate: (p: SubscriptionPlanResponse) => void;
}) {
  const kindCls = KIND_STYLES[plan.kind] ?? KIND_STYLES.CUSTOM;

  return (
    <div className={`bg-surface border flex flex-col transition-all ${
      plan.isActive ? "border-border" : "border-border/40 opacity-60"
    }`}>
      <div className={`h-0.5 w-full ${plan.isActive ? "bg-gold" : "bg-border"}`} />

      {/* Card header — dark navy bg for contrast */}
      <div className="bg-navy px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0">
            <h3 className="text-small font-bold text-white truncate">{plan.name}</h3>
            <p className="text-caption text-white/40 font-mono mt-0.5">{plan.code}</p>
          </div>
          <span className={`inline-flex items-center h-5 px-2 text-[10px] font-semibold uppercase tracking-wider border shrink-0 ${kindCls}`}>
            {KIND_LABELS[plan.kind] ?? plan.kind}
          </span>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-1.5">
          <span className="text-caption text-white/40">{plan.currency}</span>
          <span className="font-serif font-bold text-[2rem] text-gold leading-none tabular-nums">
            {parseFloat(plan.priceAmount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
          </span>
        </div>
        {plan.billingIntervalMonths && (
          <p className="text-caption text-white/30 mt-0.5">
            every {plan.billingIntervalMonths} month{plan.billingIntervalMonths > 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Limits */}
      <div className="px-5 py-4 flex-1 space-y-2">
        <p className="text-[9px] uppercase tracking-[0.12em] text-muted mb-2">Limits per org</p>
        <LimitRow icon={<CheckIcon />} label="Pageants" value={lim(plan.maxPageants)} />
        <LimitRow icon={<CheckIcon />} label="Tabulators" value={lim(plan.maxTabulatorUsers)} />

        <p className="text-[9px] uppercase tracking-[0.12em] text-muted mb-2 pt-2">Limits per pageant</p>
        <LimitRow icon={<CheckIcon />} label="Judges" value={lim(plan.maxJudgesPerPageant)} />
        <LimitRow icon={<CheckIcon />} label="Rounds" value={lim(plan.maxRoundsPerPageant)} />
        <LimitRow icon={<CheckIcon />} label="Categories / round" value={lim(plan.maxCategoriesPerRound)} />

        <p className="text-[9px] uppercase tracking-[0.12em] text-muted mb-2 pt-2">Features</p>
        <div className="flex items-center gap-2">
          <span className={`w-3 h-3 shrink-0 ${plan.publicVotingEnabled ? "text-success/70" : "text-error"}`}>
            {plan.publicVotingEnabled ? <CheckIcon /> : (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </span>
          <span className="text-caption text-muted">Public Voting</span>
          <span className={`ml-auto text-caption font-medium ${plan.publicVotingEnabled ? "text-success/80" : "text-error"}`}>
            {plan.publicVotingEnabled ? "Yes" : "No"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-3 h-3 shrink-0 ${plan.customizationEnabled ? "text-success/70" : "text-white/20"}`}>
            {plan.customizationEnabled ? <CheckIcon /> : <InfinityIcon />}
          </span>
          <span className="text-caption text-muted">Customization</span>
          <span className={`ml-auto text-caption font-medium ${plan.customizationEnabled ? "text-success" : "text-error"}`}>
            {plan.customizationEnabled ? "Yes" : "No"}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 px-5 py-3 border-t border-border">
        <button onClick={() => onEdit(plan)}
          className="flex-1 h-8 text-caption font-medium text-navy bg-navy/8 hover:bg-navy/15 transition-colors">
          Edit
        </button>
        {plan.isActive && (
          <button onClick={() => onDeactivate(plan)}
            className="flex-1 h-8 text-caption font-medium text-error bg-error/8 hover:bg-error/15 transition-colors">
            Deactivate
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminPlansPage() {
  const { data: plans = [], isLoading } = useSubscriptionPlans();
  const createMut     = useCreateSubscriptionPlan();
  const deactivateMut = useDeactivateSubscriptionPlan();

  const [addOpen,     setAddOpen]     = useState(false);
  const [editTarget,  setEditTarget]  = useState<SubscriptionPlanResponse | null>(null);
  const [deactTarget, setDeactTarget] = useState<SubscriptionPlanResponse | null>(null);
  const [addForm,     setAddForm]     = useState<PlanForm>(EMPTY);
  const [editForm,    setEditForm]    = useState<PlanForm>(EMPTY);
  const [formErr,     setFormErr]     = useState<string | null>(null);

  const updateMut = useUpdateSubscriptionPlan(editTarget?.id ?? "");

  const active   = plans.filter(p => p.isActive);
  const inactive = plans.filter(p => !p.isActive);

  async function handleAdd() {
    const err = validate(addForm); if (err) { setFormErr(err); return; }
    setFormErr(null);
    try { await createMut.mutateAsync(toRequest(addForm)); setAddOpen(false); setAddForm(EMPTY); }
    catch { setFormErr("Failed to create plan. The code may already exist."); }
  }

  async function handleEdit() {
    const err = validate(editForm); if (err) { setFormErr(err); return; }
    setFormErr(null);
    try { await updateMut.mutateAsync(toRequest(editForm)); setEditTarget(null); }
    catch { setFormErr("Failed to update plan."); }
  }

  async function handleDeactivate() {
    if (!deactTarget) return;
    await deactivateMut.mutateAsync(deactTarget.id);
    setDeactTarget(null);
  }

  function openEdit(plan: SubscriptionPlanResponse) {
    setEditForm(fromPlan(plan));
    setFormErr(null);
    setEditTarget(plan);
  }

  return (
    <AdminPageShell
      title="Subscription Plans"
      subtitle="Define plans with pricing, limits, and features that organizations can subscribe to."
      breadcrumbs={[{ label: "Dashboard", href: "/admin/dashboard" }, { label: "Finance" }, { label: "Plans" }]}
      action={
        <Button variant="secondary" size="sm" onClick={() => { setAddForm(EMPTY); setFormErr(null); setAddOpen(true); }}>
          + New Plan
        </Button>
      }
    >
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => <div key={i} className="h-80 bg-surface border border-border animate-pulse" />)}
        </div>
      )}

      {!isLoading && plans.length === 0 && (
        <div className="border border-dashed border-border bg-surface px-5 py-16 text-center">
          <p className="text-small font-semibold text-charcoal mb-1">No subscription plans yet</p>
          <p className="text-caption text-muted mb-5 max-w-xs mx-auto leading-relaxed">
            Create plans so organizations can subscribe and unlock platform features.
          </p>
          <Button variant="secondary" size="sm" onClick={() => { setAddForm(EMPTY); setFormErr(null); setAddOpen(true); }}>
            + Create First Plan
          </Button>
        </div>
      )}

      {!isLoading && active.length > 0 && (
        <section className="mb-8">
          <h2 className="font-serif font-semibold text-charcoal text-h3 mb-4 flex items-center gap-2">
            Active Plans
            <span className="inline-flex items-center h-5 px-2 text-[10px] font-semibold bg-success/8 border border-success/25 text-success">{active.length}</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {active.map(p => <PlanCard key={p.id} plan={p} onEdit={openEdit} onDeactivate={setDeactTarget} />)}
          </div>
        </section>
      )}

      {!isLoading && inactive.length > 0 && (
        <section>
          <h2 className="font-serif font-semibold text-charcoal text-h3 mb-4 flex items-center gap-2">
            Inactive Plans
            <span className="inline-flex items-center h-5 px-2 text-[10px] font-semibold bg-border/30 border border-border text-muted">{inactive.length}</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {inactive.map(p => <PlanCard key={p.id} plan={p} onEdit={openEdit} onDeactivate={setDeactTarget} />)}
          </div>
        </section>
      )}

      {/* Add modal */}
      <Modal open={addOpen} onClose={() => { setAddOpen(false); setFormErr(null); }}
        title="New Subscription Plan" description="Configure pricing, limits, and features." size="lg"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => { setAddOpen(false); setFormErr(null); }} disabled={createMut.isPending}>Cancel</Button>
            <Button variant="secondary" size="sm" onClick={handleAdd} loading={createMut.isPending}>Create Plan</Button>
          </>
        }>
        <PlanFormFields form={addForm} onChange={setAddForm} error={formErr} />
      </Modal>

      {/* Edit modal */}
      <Modal open={editTarget !== null} onClose={() => { setEditTarget(null); setFormErr(null); }}
        title="Edit Plan" description={editTarget?.name} size="lg"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => { setEditTarget(null); setFormErr(null); }} disabled={updateMut.isPending}>Cancel</Button>
            <Button variant="secondary" size="sm" onClick={handleEdit} loading={updateMut.isPending}>Save Changes</Button>
          </>
        }>
        <PlanFormFields form={editForm} onChange={setEditForm} error={formErr} />
      </Modal>

      {/* Deactivate confirm */}
      <ConfirmModal
        open={deactTarget !== null} onClose={() => setDeactTarget(null)}
        onConfirm={handleDeactivate} loading={deactivateMut.isPending}
        title="Deactivate Plan" destructive confirmLabel="Deactivate"
        description={`Deactivate "${deactTarget?.name}"? It will no longer appear for new subscribers. Existing subscriptions are not affected.`}
      />
    </AdminPageShell>
  );
}
