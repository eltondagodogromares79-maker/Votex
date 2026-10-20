"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import Link from "next/link";
import OrgPageShell from "@/src/features/org_owner/components/OrgPageShell";
import OrgBadge from "@/src/features/org_owner/components/OrgBadge";
import OrgEmptyState from "@/src/features/org_owner/components/OrgEmptyState";
import { Button } from "@/src/components/ui/Button";
import { CloudinaryImageUpload } from "@/src/components/ui/CloudinaryImageUpload";
import { Modal } from "@/src/components/ui/Modal";
import { useSession } from "@/src/features/auth/context/SessionContext";
import { usePageants, useCreatePageant, useRestorePageant } from "@/src/features/org_owner/hooks/usePageants";
import { useSubscriptionUsage } from "@/src/features/org_owner/hooks/useSubscription";
import { useToast } from "@/src/components/ui/Toast";
import { ApiError } from "@/src/lib/api/client";
import type { PageantResponse } from "@/src/types";

// ─── Schema ───────────────────────────────────────────────────────────────────

const addSchema = z.object({
  name:        z.string().min(1, "Name is required").max(200),
  slug:        z.string()
    .min(3, "Slug must be at least 3 characters").max(100)
    .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]{1,2}$/, "Lowercase letters, numbers, hyphens only"),
  description: z.string().max(1000).optional().or(z.literal("")),
  logoUrl: z.string().url("Upload a valid pageant image.").optional().or(z.literal("")),
  venue:       z.string().max(300).optional().or(z.literal("")),
  eventDate:   z.string().optional().or(z.literal("")),
  startTime:   z.string().optional().or(z.literal("")),
  endTime:     z.string().optional().or(z.literal("")),
  isPublic:    z.boolean(),
});

type AddFormValues = z.infer<typeof addSchema>;

// ─── Design tokens ────────────────────────────────────────────────────────────

const fieldLabel    = "block text-small font-medium text-white/80 mb-1.5";
const fieldInput    = "w-full h-10 px-3 bg-white/8 border border-white/15 text-white text-small placeholder:text-white/30 focus:outline-none focus:border-gold/60 transition-colors duration-150";
const fieldError    = "text-caption text-error mt-1";
const fieldTextarea = "w-full px-3 py-2.5 bg-white/8 border border-white/15 text-white text-small placeholder:text-white/30 focus:outline-none focus:border-gold/60 transition-colors duration-150 min-h-[80px] resize-y";

const STATUS_VARIANT: Record<string, "success" | "gold" | "navy" | "muted" | "warning"> = {
  live: "success", ready: "navy", configuring: "gold",
  draft: "muted", paused: "warning", completed: "muted", archived: "muted",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toSlug(name: string): string {
  return name.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 100)
    .replace(/^-+|-+$/g, "");
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

function PageantIcon() {
  return (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.25} viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
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

// ─── Pageant Card — matches public pageants page card style ──────────────────

function PageantCard({ pageant, onRestore, restoring, canRestore, restoreLimitMessage }: {
  pageant: PageantResponse;
  onRestore: (pageant: PageantResponse) => void;
  restoring: boolean;
  canRestore: boolean;
  restoreLimitMessage: string;
}) {
  return (
    <div className="bg-surface overflow-hidden flex flex-col hover:-translate-y-0.5 transition-transform duration-200">

      {/* Image / placeholder — h-48 full bleed */}
      <div className="relative h-48 overflow-hidden bg-navy shrink-0">
        {pageant.logoUrl ? (
          <Image
            src={pageant.logoUrl}
            alt={pageant.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover object-center transition-transform duration-500 hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-navy select-none">
            <span className="font-serif font-bold text-gold/25 text-[2.5rem] tracking-[0.3em] leading-none">
              VOTEX
            </span>
            <span className="text-caption text-white/20 mt-2 tracking-[0.18em] uppercase">
              No image added
            </span>
          </div>
        )}

        {/* Bottom gradient so badges are readable */}
        <div className="absolute inset-0 bg-gradient-to-t from-navy/70 via-transparent to-transparent pointer-events-none" />

        {/* Status badge — top right */}
        <div className="absolute top-3 right-3">
          <OrgBadge variant={STATUS_VARIANT[pageant.status] ?? "muted"}>
            {pageant.status}
          </OrgBadge>
        </div>

        {/* Public pill — top left */}
        {pageant.isPublic && (
          <span className="absolute top-3 left-3 text-caption font-semibold px-2 py-0.5 bg-success/80 text-white">
            Public
          </span>
        )}

        {/* Slug — bottom left over gradient */}
        <span className="absolute bottom-3 left-4 text-caption font-semibold uppercase tracking-widest text-gold/70 font-mono">
          {pageant.slug}
        </span>
      </div>

      {/* Card body */}
      <div className="px-5 py-4 flex flex-col gap-3 flex-1">
        <h3 className="font-serif font-bold text-charcoal text-h3 leading-snug line-clamp-2">
          {pageant.name}
        </h3>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-small text-muted">
            <span className="text-gold/60 shrink-0" aria-hidden="true">✦</span>
            {pageant.eventDate
              ? new Date(pageant.eventDate).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" })
              : "Date TBD"}
          </div>
          {pageant.venue && (
            <div className="flex items-center gap-2 text-small text-muted">
              <span className="text-gold/60 shrink-0" aria-hidden="true">✦</span>
              <span className="truncate">{pageant.venue}</span>
            </div>
          )}
          {pageant.description && (
            <p className="text-caption text-muted leading-relaxed line-clamp-2 mt-1">
              {pageant.description}
            </p>
          )}
        </div>
      </div>

      {/* Card footer */}
      <div className="px-5 pb-5 pt-0">
        <div className="border-t border-border pt-4 flex items-center gap-2">
          <Link
            href={`/org_owner/pageants/${pageant.id}`}
            className="flex-1 h-9 flex items-center justify-center gap-1.5 bg-navy text-white text-small font-medium hover:bg-navy/90 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
            </svg>
            Dashboard
          </Link>
          {pageant.status.toLowerCase() === "archived" ? (
            <button
              onClick={() => onRestore(pageant)}
              disabled={restoring || !canRestore}
              title={!canRestore ? restoreLimitMessage : undefined}
              className="flex-1 h-9 flex items-center justify-center gap-1.5 bg-success/10 border border-success/25 text-success text-small font-medium hover:bg-success/15 disabled:opacity-50 transition-colors"
            >{restoring ? "Restoring…" : "Restore pageant"}</button>
          ) : (
            <Link
              href={`/org_owner/pageants/${pageant.id}/settings`}
              className="flex-1 h-9 flex items-center justify-center gap-1.5 bg-gold border border-border text-charcoal text-small font-medium hover:bg-slate hover:border-navy/30 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </Link>
          )}
        </div>
      </div>

    </div>
  );
}

// ─── Create form ──────────────────────────────────────────────────────────────

function CreatePageantForm({
  form,
  onNameChange,
  onSlugChange,
  onUploadingChange,
}: {
  form: ReturnType<typeof useForm<AddFormValues>>;
  onNameChange: (name: string) => void;
  onSlugChange: () => void;
  onUploadingChange: (uploading: boolean) => void;
}) {
  const { register, formState: { errors } } = form;
  return (
    <form id="create-pageant-form" noValidate className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label={<>Name <span className="text-error">*</span></>} error={errors.name?.message}>
          <input type="text" placeholder="Miss Universe Philippines 2026" className={fieldInput}
            {...register("name")} onChange={(e) => { register("name").onChange(e); onNameChange(e.target.value); }} />
        </Field>
        <Field label={<>Slug <span className="text-error">*</span></>} error={errors.slug?.message} hint="Auto-generated · you can edit it">
          <input type="text" placeholder="miss-universe-ph-2026" className={fieldInput}
            {...register("slug")} onChange={(e) => { register("slug").onChange(e); onSlugChange(); }} />
        </Field>
      </div>
      <Field label="Description" error={errors.description?.message}>
        <textarea placeholder="Brief description of the pageant…" className={fieldTextarea} {...register("description")} />
      </Field>
      <Field label="Pageant image" hint="Optional · PNG, JPG, or WebP up to 10 MB">
        <CloudinaryImageUpload
          folder="pageant-images"
          value={form.watch("logoUrl")}
          label="Upload pageant image"
          dark
          onUploadingChange={onUploadingChange}
          onChange={(url) => form.setValue("logoUrl", url, { shouldDirty: true, shouldValidate: true })}
        />
      </Field>
      <Field label="Venue" error={errors.venue?.message}>
        <input type="text" placeholder="e.g. Smart Araneta Coliseum, Quezon City" className={fieldInput} {...register("venue")} />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Field label="Event Date">
          <input type="date" className={fieldInput} {...register("eventDate")} />
        </Field>
        <Field label="Start Time" hint="Can be past midnight">
          <input type="time" className={fieldInput} {...register("startTime")} />
        </Field>
        <Field label="End Time" hint="Can be past midnight">
          <input type="time" className={fieldInput} {...register("endTime")} />
        </Field>
      </div>
      <div className="flex items-center gap-3">
        <input type="checkbox" id="create-public" {...register("isPublic")} className="w-4 h-4 accent-gold shrink-0" />
        <label htmlFor="create-public" className="text-small text-white/70 cursor-pointer leading-relaxed">
          Make this pageant publicly visible to the audience
        </label>
      </div>
    </form>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OrgOwnerPageantsPage() {
  const { currentUser } = useSession();
  const orgId = currentUser?.organizationId ?? "";
  const { toast } = useToast();

  const { data: pageants = [], isLoading, isError, refetch } = usePageants(orgId);
  const { data: usage, isLoading: usageLoading } = useSubscriptionUsage(orgId);
  const createMutation = useCreatePageant(orgId);
  const restoreMutation = useRestorePageant(orgId);

  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreate,   setShowCreate]   = useState(false);
  const [createError,  setCreateError]  = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);

  const form = useForm<AddFormValues>({ resolver: zodResolver(addSchema), defaultValues: { isPublic: false, logoUrl: "" } });
  const [slugEdited, setSlugEdited] = useState(false);
  const canCreatePageant = !usageLoading && !!usage?.planName && (usage.maxPageants === null || usage.pageantsUsed < usage.maxPageants);
  const pageantLimitMessage = usageLoading
    ? "Checking your subscription limits…"
    : !usage?.planName
      ? "An active subscription is required to create pageants."
      : `You've used ${usage.pageantsUsed} of ${usage.maxPageants ?? "∞"} pageant slots.`;

  function closeCreate() { setShowCreate(false); form.reset(); setSlugEdited(false); setCreateError(null); }

  function handleNameChange(name: string) {
    if (!slugEdited) form.setValue("slug", toSlug(name), { shouldValidate: false });
  }

  async function onCreate(data: AddFormValues) {
    setCreateError(null);
    if (!canCreatePageant) {
      setCreateError(pageantLimitMessage);
      return;
    }
    try {
      await createMutation.mutateAsync({
        name: data.name, slug: data.slug,
        description: data.description || null, venue: data.venue || null,
        logoUrl: data.logoUrl || null,
        eventDate: data.eventDate || null, startTime: data.startTime || null,
        endTime: data.endTime || null, isPublic: data.isPublic,
      });
      toast.success(`"${data.name}" created.`);
      closeCreate();
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.userMessage : "Failed to create pageant.");
    }
  }

  async function onRestore(pageant: PageantResponse) {
    if (!canCreatePageant) {
      toast.error(pageantLimitMessage);
      return;
    }
    try {
      await restoreMutation.mutateAsync(pageant.id);
      toast.success(`"${pageant.name}" restored.`);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.userMessage : "Could not restore pageant.");
    }
  }

  const liveCount  = pageants.filter((p) => p.status === "live").length;
  const draftCount = pageants.filter((p) => p.status === "draft").length;
  function openCreate() {
    if (!canCreatePageant) {
      toast.error(pageantLimitMessage);
      return;
    }
    form.reset({ isPublic: false, logoUrl: "" });
    setSlugEdited(false);
    setCreateError(null);
    setShowCreate(true);
  }

  const filtered = pageants.filter((p) => {
    const q = search.toLowerCase();
    return (
      (p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q)) &&
      (statusFilter === "all" || p.status === statusFilter)
    );
  });

  return (
    <OrgPageShell
      title="Pageants"
      subtitle="Create and manage your organization's pageant events."
      breadcrumbs={[{ label: "Dashboard", href: "/org_owner/dashboard" }, { label: "Pageants" }]}
      action={<Button variant="secondary" size="sm" onClick={openCreate} disabled={!canCreatePageant} title={!canCreatePageant ? pageantLimitMessage : undefined}>+ New Pageant</Button>}
    >

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Pageants used"  value={usageLoading ? "—" : usage?.planName == null ? "No active plan" : `${usage.pageantsUsed} / ${usage.maxPageants ?? "∞"}`} sub={usage?.planName == null ? "Choose a plan to view limits" : usage.maxPageants == null ? "Unlimited pageants" : `${Math.max(0, usage.maxPageants - usage.pageantsUsed)} remaining`} />
        <StatCard label="Total"  value={isLoading ? "—" : pageants.length} sub="all pageants" />
        <StatCard label="Live"   value={isLoading ? "—" : liveCount}       sub="currently running" />
        <StatCard label="Draft"  value={isLoading ? "—" : draftCount}      sub="in preparation" />
      </div>

      {isError && (
        <div className="bg-error/8 border border-error/20 px-4 py-4 mb-6">
          <p className="text-small font-semibold text-error">Unable to load pageants.</p>
          <button onClick={() => refetch()} className="mt-1 text-caption font-medium text-navy hover:underline">Try again</button>
        </div>
      )}

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-72" />)}
        </div>
      )}

      {!isLoading && !isError && (
        <>
          {/* Search + filter */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1 max-w-sm">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none"
                fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input type="text" placeholder="Search by name or slug…" value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-3 bg-surface border border-border text-small text-charcoal placeholder:text-muted focus:outline-none focus:border-navy transition-colors" />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 bg-surface border border-border text-small text-charcoal focus:outline-none focus:border-navy transition-colors">
              <option value="all">All statuses</option>
              {["draft","configuring","ready","live","paused","completed","archived"].map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>

          {filtered.length === 0 ? (
            <OrgEmptyState
              icon={<PageantIcon />}
              heading={search || statusFilter !== "all" ? "No pageants match your filters" : "No pageants yet"}
              description={search || statusFilter !== "all" ? "Try adjusting your search or filter." : "Create your first pageant to get started."}
              action={!search && statusFilter === "all" ? <Button variant="secondary" size="sm" onClick={openCreate} disabled={!canCreatePageant} title={!canCreatePageant ? pageantLimitMessage : undefined}>+ New Pageant</Button> : undefined}
            />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filtered.map((p) => <PageantCard key={p.id} pageant={p} onRestore={onRestore} restoring={restoreMutation.isPending} canRestore={canCreatePageant} restoreLimitMessage={pageantLimitMessage} />)}
              </div>
              <p className="text-caption text-muted mt-4">
                Showing {filtered.length} of {pageants.length} pageant{pageants.length !== 1 ? "s" : ""}
              </p>
            </>
          )}
        </>
      )}

      {/* Create modal */}
      <Modal open={showCreate} onClose={closeCreate} title="Create Pageant"
        description="Set up a new pageant event for your organization." size="lg"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={closeCreate} disabled={form.formState.isSubmitting || imageUploading}>Cancel</Button>
            <Button variant="secondary" size="sm" onClick={form.handleSubmit(onCreate)} loading={form.formState.isSubmitting} disabled={imageUploading || !canCreatePageant}>
              Create Pageant
            </Button>
          </>
        }
      >
        {!canCreatePageant ? <div role="status" className="mb-4 border border-amber-300 bg-amber-50 px-4 py-3 text-small text-amber-900">{pageantLimitMessage}</div> : null}
        <CreatePageantForm form={form} onNameChange={handleNameChange} onSlugChange={() => setSlugEdited(true)} onUploadingChange={setImageUploading} />
        {createError && (
          <div className="mt-4 flex items-start gap-3 bg-error/10 border border-error/25 px-4 py-3">
            <svg className="w-4 h-4 text-error shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <p className="text-small text-error leading-relaxed">{createError}</p>
          </div>
        )}
      </Modal>

    </OrgPageShell>
  );
}
