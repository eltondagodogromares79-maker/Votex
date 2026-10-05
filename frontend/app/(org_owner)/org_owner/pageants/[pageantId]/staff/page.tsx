"use client";

import { use, useState } from "react";
import Link from "next/link";
import OrgPageShell from "@/src/features/org_owner/components/OrgPageShell";
import { Modal, ConfirmModal } from "@/src/components/ui/Modal";
import { Button } from "@/src/components/ui/Button";
import { useSession } from "@/src/features/auth/context/SessionContext";
import { usePageant } from "@/src/features/org_owner/hooks/usePageants";
import { useCoordinators } from "@/src/features/org_owner/hooks/useCoordinators";
import {
  usePageantCoordinators,
  useAssignPageantCoordinator,
  useRevokePageantCoordinator,
  usePageantJudges,
  useAssignJudge,
  useRevokeJudge,
  usePageantTabulators,
  useAssignTabulator,
  useRevokeTabulator,
} from "@/src/features/org_owner/hooks/usePageantStaff";
import type {
  PageantStaffResponse,
  AssignPageantStaffRequest,
  CoordinatorResponse,
} from "@/src/types";

// ─── Design tokens ────────────────────────────────────────────────────────────

const LBL = "block text-small font-medium text-white/80 mb-1.5";
const INP =
  "w-full h-10 px-3 bg-white/8 border border-white/15 text-white text-small " +
  "placeholder:text-white/30 focus:outline-none focus:border-gold/60 transition-colors duration-150";

// ─── Email form (judges + tabulators) ────────────────────────────────────────

interface EmailForm {
  email: string;
  firstName: string;
  lastName: string;
}

const EMPTY_EMAIL: EmailForm = { email: "", firstName: "", lastName: "" };

function EmailAssignForm({
  form,
  onChange,
  error,
}: {
  form: EmailForm;
  onChange: (f: EmailForm) => void;
  error: string | null;
}) {
  const set =
    (k: keyof EmailForm) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onChange({ ...form, [k]: e.target.value });

  return (
    <div className="space-y-4">
      <div>
        <label className={LBL}>
          Email <span className="text-gold">*</span>
        </label>
        <input
          type="email"
          className={INP}
          placeholder="staff@example.com"
          value={form.email}
          onChange={set("email")}
          autoComplete="off"
        />
        <p className="text-caption text-white/35 mt-1.5">
          An account will be created and credentials sent if this email isn't registered yet.
        </p>
      </div>

      {/* Credential notice */}
      <div className="flex gap-3 bg-white/5 border border-white/12 px-4 py-3">
        <svg className="w-4 h-4 text-gold/70 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
        </svg>
        <p className="text-caption text-white/50 leading-relaxed">
          If a new account is created, a temporary password will be generated and emailed to this address. They can use it to log in and should change it after their first sign-in.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={LBL}>First Name</label>
          <input className={INP} placeholder="Juan" value={form.firstName} onChange={set("firstName")} />
        </div>
        <div>
          <label className={LBL}>Last Name</label>
          <input className={INP} placeholder="dela Cruz" value={form.lastName} onChange={set("lastName")} />
        </div>
      </div>
      {error && (
        <p className="text-caption text-error bg-error/10 border border-error/20 px-3 py-2">{error}</p>
      )}
    </div>
  );
}

// ─── Coordinator assign modal (select from existing org coordinators only) ────

function CoordinatorAssignModal({
  open,
  onClose,
  orgCoordinators,
  alreadyAssigned,
  isPending,
  onAssignExisting,
}: {
  open: boolean;
  onClose: () => void;
  orgCoordinators: CoordinatorResponse[];
  alreadyAssigned: PageantStaffResponse[];
  isPending: boolean;
  onAssignExisting: (c: CoordinatorResponse) => void;
}) {
  const [search, setSearch] = useState("");

  const assignedIds = new Set(alreadyAssigned.map(m => m.userId));

  const filtered = orgCoordinators.filter(c => {
    if (assignedIds.has(c.userId)) return false;
    const q = search.toLowerCase();
    return (
      c.firstName.toLowerCase().includes(q) ||
      c.lastName.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
    );
  });

  function handleClose() {
    setSearch("");
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Assign Coordinator"
      description="Select an existing org coordinator to assign to this pageant."
      size="md"
      footer={
        <Button variant="ghost" size="sm" onClick={handleClose}>Cancel</Button>
      }
    >
      {orgCoordinators.length === 0 ? (
        /* No org coordinators at all */
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <svg className="w-10 h-10 text-white/20 mb-3" fill="none" stroke="currentColor" strokeWidth={1.25} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
          <p className="text-small text-white/60 mb-1">No org coordinators yet</p>
          <p className="text-caption text-white/35 leading-relaxed max-w-xs mb-4">
            You need to add an org-level coordinator first before assigning them to a pageant.
          </p>
          <a
            href="/org_owner/teams/coordinator"
            className="inline-flex items-center gap-1.5 text-caption text-gold hover:underline underline-offset-2"
          >
            Go to Coordinators page
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              placeholder="Search coordinators…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 bg-white/8 border border-white/15 text-white text-small placeholder:text-white/30 focus:outline-none focus:border-gold/60 transition-colors"
            />
          </div>

          {/* Info note */}
          <div className="flex gap-2.5 bg-white/5 border border-white/10 px-3 py-2.5">
            <svg className="w-3.5 h-3.5 text-gold/60 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
            <p className="text-caption text-white/45 leading-relaxed">
              Only active org coordinators can be assigned to a pageant. To add someone new,{" "}
              <a href="/org_owner/teams/coordinator" className="text-gold hover:underline underline-offset-2">
                add them as an org coordinator first
              </a>.
            </p>
          </div>

          {/* List */}
          <div className="max-h-60 overflow-y-auto border border-white/10 divide-y divide-white/8">
            {filtered.length === 0 ? (
              <p className="text-caption text-white/40 px-4 py-4 text-center">
                {search ? "No matches found." : "All coordinators are already assigned to this pageant."}
              </p>
            ) : (
              filtered.map(c => {
                const initials = `${c.firstName[0]}${c.lastName[0]}`.toUpperCase();
                return (
                  <button
                    key={c.userId}
                    onClick={() => onAssignExisting(c)}
                    disabled={isPending}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/8 transition-colors text-left disabled:opacity-50"
                  >
                    <div className="w-8 h-8 bg-gold/15 border border-gold/25 flex items-center justify-center shrink-0">
                      <span className="text-caption font-semibold text-gold">{initials}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-small font-semibold text-white truncate">
                        {c.firstName} {c.lastName}
                      </p>
                      <p className="text-caption text-white/40 truncate">{c.email}</p>
                    </div>
                    <svg className="w-4 h-4 text-white/20 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

// ─── Staff row ────────────────────────────────────────────────────────────────

function StaffRow({
  member,
  onRevoke,
}: {
  member: PageantStaffResponse;
  onRevoke: (m: PageantStaffResponse) => void;
}) {
  const initials =
    `${member.firstName?.[0] ?? ""}${member.lastName?.[0] ?? ""}`.toUpperCase() ||
    member.email[0].toUpperCase();

  return (
    <div className="flex items-center gap-4 px-5 py-3.5 border-b border-border/60 last:border-b-0 hover:bg-slate/30 transition-colors">
      <div className="w-8 h-8 bg-navy/10 flex items-center justify-center shrink-0">
        <span className="text-caption font-semibold text-navy">{initials}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-small font-semibold text-charcoal truncate">
          {member.firstName || member.lastName
            ? `${member.firstName ?? ""} ${member.lastName ?? ""}`.trim()
            : <span className="text-muted font-normal italic">No name</span>
          }
        </p>
        <p className="text-caption text-muted truncate">{member.email}</p>
      </div>
      <span className={`hidden sm:inline-flex items-center h-5 px-2 text-[10px] font-semibold uppercase tracking-wider border shrink-0 ${
        member.isActive
          ? "bg-success/8 border-success/25 text-success"
          : "bg-border/30 border-border text-muted"
      }`}>
        {member.isActive ? "Active" : "Inactive"}
      </span>
      <button
        onClick={() => onRevoke(member)}
        className="h-8 w-8 flex items-center justify-center text-muted hover:text-error hover:bg-error/8 transition-colors shrink-0"
        aria-label="Remove staff member"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M22 10.5h-6m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
        </svg>
      </button>
    </div>
  );
}

// ─── Staff section ────────────────────────────────────────────────────────────

function StaffSection({
  title,
  description,
  members,
  isLoading,
  onAssign,
  onRevoke,
}: {
  title: string;
  description: string;
  members: PageantStaffResponse[];
  isLoading: boolean;
  onAssign: () => void;
  onRevoke: (m: PageantStaffResponse) => void;
}) {
  return (
    <section className="bg-surface border border-border overflow-hidden">
      <div className="bg-navy px-5 py-4 sm:px-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="font-serif font-bold text-gold text-h3">{title}</h2>
          <p className="text-small text-white/50 mt-0.5">{description}</p>
        </div>
        <button
          onClick={onAssign}
          className="inline-flex items-center gap-1.5 h-8 px-3 bg-gold/15 border border-gold/30 text-gold text-caption font-medium hover:bg-gold/25 transition-colors shrink-0"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Assign
        </button>
      </div>

      {isLoading && (
        <div className="px-5 py-4 space-y-2">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-12 bg-slate/40 animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && members.length === 0 && (
        <div className="flex items-center gap-3 px-5 py-5">
          <svg className="w-4 h-4 shrink-0 text-border" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
          </svg>
          <span className="text-small text-muted">No {title.toLowerCase()} assigned yet.</span>
        </div>
      )}

      {!isLoading && members.length > 0 && (
        <div>
          {members.map(m => (
            <StaffRow key={m.userId} member={m} onRevoke={onRevoke} />
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type StaffRole = "coordinator" | "judge" | "tabulator";

export default function PageantStaffPage({
  params,
}: {
  params: Promise<{ pageantId: string }>;
}) {
  const { pageantId } = use(params);
  const { currentUser } = useSession();
  const orgId = currentUser?.organizationId ?? "";

  const { data: pageant }                                    = usePageant(orgId, pageantId);
  const { data: orgCoordinators = [] }                       = useCoordinators(orgId);
  const { data: coordinators = [], isLoading: coordLoading } = usePageantCoordinators(orgId, pageantId);
  const { data: judges = [],       isLoading: judgeLoading } = usePageantJudges(orgId, pageantId);
  const { data: tabulators = [],   isLoading: tabLoading }   = usePageantTabulators(orgId, pageantId);

  const assignCoord = useAssignPageantCoordinator(orgId, pageantId);
  const revokeCoord = useRevokePageantCoordinator(orgId, pageantId);
  const assignJudge = useAssignJudge(orgId, pageantId);
  const revokeJudge = useRevokeJudge(orgId, pageantId);
  const assignTab   = useAssignTabulator(orgId, pageantId);
  const revokeTab   = useRevokeTabulator(orgId, pageantId);

  // modal open state
  const [coordModalOpen,  setCoordModalOpen]  = useState(false);
  const [judgeModalOpen,  setJudgeModalOpen]  = useState(false);
  const [tabModalOpen,    setTabModalOpen]    = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<{ role: StaffRole; member: PageantStaffResponse } | null>(null);

  // judge / tab email forms
  const [judgeForm,  setJudgeForm]  = useState<EmailForm>(EMPTY_EMAIL);
  const [tabForm,    setTabForm]    = useState<EmailForm>(EMPTY_EMAIL);
  const [judgeErr,   setJudgeErr]   = useState<string | null>(null);
  const [tabErr,     setTabErr]     = useState<string | null>(null);

  // ── Coordinator assign ────────────────────────────────────────────────────

  async function handleAssignCoordExisting(c: CoordinatorResponse) {
    await assignCoord.mutateAsync({ email: c.email, firstName: c.firstName, lastName: c.lastName });
    setCoordModalOpen(false);
  }

  // ── Judge assign ──────────────────────────────────────────────────────────

  async function handleAssignJudge() {
    if (!judgeForm.email.trim()) { setJudgeErr("Email is required."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(judgeForm.email.trim())) { setJudgeErr("Enter a valid email address."); return; }
    setJudgeErr(null);
    try {
      await assignJudge.mutateAsync({
        email:     judgeForm.email.trim(),
        firstName: judgeForm.firstName.trim() || null,
        lastName:  judgeForm.lastName.trim() || null,
      });
      setJudgeModalOpen(false);
      setJudgeForm(EMPTY_EMAIL);
    } catch {
      setJudgeErr("Failed to assign judge. They may already be assigned.");
    }
  }

  // ── Tabulator assign ──────────────────────────────────────────────────────

  async function handleAssignTab() {
    if (!tabForm.email.trim()) { setTabErr("Email is required."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(tabForm.email.trim())) { setTabErr("Enter a valid email address."); return; }
    setTabErr(null);
    try {
      await assignTab.mutateAsync({
        email:     tabForm.email.trim(),
        firstName: tabForm.firstName.trim() || null,
        lastName:  tabForm.lastName.trim() || null,
      });
      setTabModalOpen(false);
      setTabForm(EMPTY_EMAIL);
    } catch {
      setTabErr("Failed to assign tabulator. They may already be assigned.");
    }
  }

  // ── Revoke ────────────────────────────────────────────────────────────────

  async function handleRevoke() {
    if (!revokeTarget) return;
    const { role, member } = revokeTarget;
    if (role === "coordinator")  await revokeCoord.mutateAsync(member.userId);
    else if (role === "judge")   await revokeJudge.mutateAsync(member.userId);
    else if (role === "tabulator") await revokeTab.mutateAsync(member.userId);
    setRevokeTarget(null);
  }

  const ROLE_LABELS: Record<StaffRole, string> = {
    coordinator: "Coordinator",
    judge:       "Judge",
    tabulator:   "Tabulator",
  };

  const pageantName = pageant?.name ?? "Pageant";

  return (
    <OrgPageShell
      title="Staff"
      subtitle={pageantName}
      breadcrumbs={[
        { label: "Pageants",  href: "/org_owner/pageants" },
        { label: pageantName, href: `/org_owner/pageants/${pageantId}` },
        { label: "Staff" },
      ]}
      action={
        <Link
          href={`/org_owner/pageants/${pageantId}`}
          className="inline-flex items-center gap-2 h-9 px-4 bg-surface border border-border text-charcoal text-small font-medium hover:border-navy/50 hover:text-navy transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back
        </Link>
      }
    >
      <div className="space-y-6">

        <StaffSection
          title="Coordinators"
          description="Manage day-to-day operations for this pageant."
          members={coordinators}
          isLoading={coordLoading}
          onAssign={() => setCoordModalOpen(true)}
          onRevoke={m => setRevokeTarget({ role: "coordinator", member: m })}
        />

        <StaffSection
          title="Judges"
          description="Submit scores for contestants across scoring rounds."
          members={judges}
          isLoading={judgeLoading}
          onAssign={() => { setJudgeForm(EMPTY_EMAIL); setJudgeErr(null); setJudgeModalOpen(true); }}
          onRevoke={m => setRevokeTarget({ role: "judge", member: m })}
        />

        <StaffSection
          title="Tabulators"
          description="Review and calculate live results."
          members={tabulators}
          isLoading={tabLoading}
          onAssign={() => { setTabForm(EMPTY_EMAIL); setTabErr(null); setTabModalOpen(true); }}
          onRevoke={m => setRevokeTarget({ role: "tabulator", member: m })}
        />

      </div>

      {/* ── Coordinator modal (select existing or add new) ────────────────── */}
      <CoordinatorAssignModal
        open={coordModalOpen}
        onClose={() => setCoordModalOpen(false)}
        orgCoordinators={orgCoordinators}
        alreadyAssigned={coordinators}
        isPending={assignCoord.isPending}
        onAssignExisting={handleAssignCoordExisting}
      />

      {/* ── Judge modal ───────────────────────────────────────────────────── */}
      <Modal
        open={judgeModalOpen}
        onClose={() => { setJudgeModalOpen(false); setJudgeErr(null); }}
        title="Assign Judge"
        description="Enter the judge's email. An account will be created if they aren't registered yet."
        size="md"
        footer={
          <>
            <Button variant="ghost" size="sm"
              onClick={() => { setJudgeModalOpen(false); setJudgeErr(null); }}
              disabled={assignJudge.isPending}>
              Cancel
            </Button>
            <Button variant="secondary" size="sm" onClick={handleAssignJudge} loading={assignJudge.isPending}>
              Assign Judge
            </Button>
          </>
        }
      >
        <EmailAssignForm form={judgeForm} onChange={setJudgeForm} error={judgeErr} />
      </Modal>

      {/* ── Tabulator modal ───────────────────────────────────────────────── */}
      <Modal
        open={tabModalOpen}
        onClose={() => { setTabModalOpen(false); setTabErr(null); }}
        title="Assign Tabulator"
        description="Enter the tabulator's email. An account will be created if they aren't registered yet."
        size="md"
        footer={
          <>
            <Button variant="ghost" size="sm"
              onClick={() => { setTabModalOpen(false); setTabErr(null); }}
              disabled={assignTab.isPending}>
              Cancel
            </Button>
            <Button variant="secondary" size="sm" onClick={handleAssignTab} loading={assignTab.isPending}>
              Assign Tabulator
            </Button>
          </>
        }
      >
        <EmailAssignForm form={tabForm} onChange={setTabForm} error={tabErr} />
      </Modal>

      {/* ── Revoke confirm ────────────────────────────────────────────────── */}
      <ConfirmModal
        open={revokeTarget !== null}
        onClose={() => setRevokeTarget(null)}
        onConfirm={handleRevoke}
        title={`Remove ${revokeTarget ? ROLE_LABELS[revokeTarget.role] : "Staff"}`}
        description={
          revokeTarget
            ? `Remove ${revokeTarget.member.firstName
                ? `${revokeTarget.member.firstName} ${revokeTarget.member.lastName}`
                : revokeTarget.member.email
              } from this pageant? They will lose access immediately.`
            : ""
        }
        confirmLabel="Remove"
        loading={revokeCoord.isPending || revokeJudge.isPending || revokeTab.isPending}
        destructive
      />

    </OrgPageShell>
  );
}
