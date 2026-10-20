"use client";

import { use, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import OrgPageShell from "@/src/features/org_owner/components/OrgPageShell";
import { Button } from "@/src/components/ui/Button";
import { CloudinaryImageUpload } from "@/src/components/ui/CloudinaryImageUpload";
import { ConfirmModal } from "@/src/components/ui/Modal";
import { useSession } from "@/src/features/auth/context/SessionContext";
import {
  usePageant,
  useUpdatePageant,
  useArchivePageant,
  usePublishPageant,
} from "@/src/features/org_owner/hooks/usePageants";
import { useToast } from "@/src/components/ui/Toast";
import { ApiError } from "@/src/lib/api/client";

// ─── Schema ───────────────────────────────────────────────────────────────────

const settingsSchema = z.object({
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

type SettingsFormValues = z.infer<typeof settingsSchema>;

// ─── Design tokens ────────────────────────────────────────────────────────────

const fieldLabel    = "block text-small font-medium text-charcoal mb-1.5";
const fieldInput    = "w-full h-10 px-3 bg-surface border border-border text-small text-charcoal placeholder:text-muted focus:outline-none focus:border-navy transition-colors";
const fieldHint     = "text-caption text-muted mt-1";
const fieldError    = "text-caption text-error mt-1";
const fieldTextarea = "w-full px-3 py-2.5 bg-surface border border-border text-small text-charcoal placeholder:text-muted focus:outline-none focus:border-navy transition-colors min-h-[80px] resize-y";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toTimeInput(v: string | null | undefined): string {
  if (!v) return "";
  return v.length > 5 ? v.slice(0, 5) : v;
}

// ─── Field ────────────────────────────────────────────────────────────────────

function Field({ label, error, hint, children }: {
  label: React.ReactNode; error?: string; hint?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className={fieldLabel}>{label}</label>
      {children}
      {error && <p className={fieldError}>{error}</p>}
      {!error && hint && <p className={fieldHint}>{hint}</p>}
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, description, children }: {
  title: string; description?: string; children: React.ReactNode;
}) {
  return (
    <section className="bg-surface border border-border overflow-hidden">
      {/* Navy header bar */}
      <div className="bg-navy px-5 py-4 sm:px-6">
        <h2 className="font-serif font-bold text-gold text-h3">{title}</h2>
        {description && <p className="text-small text-white/50 mt-0.5">{description}</p>}
      </div>
      <div className="px-5 py-5 sm:px-6">{children}</div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PageantSettingsPage({
  params,
}: {
  params: Promise<{ pageantId: string }>;
}) {
  const { pageantId } = use(params);
  const router = useRouter();
  const { currentUser } = useSession();
  const orgId = currentUser?.organizationId ?? "";
  const { toast } = useToast();

  const { data: pageant, isLoading, isError } = usePageant(orgId, pageantId);
  const updateMutation  = useUpdatePageant(orgId, pageantId);
  const archiveMutation = useArchivePageant(orgId);
  const publishMutation = usePublishPageant(orgId, pageantId);

  const [showArchive, setShowArchive] = useState(false);
  const [showPublish, setShowPublish] = useState(false);
  const [saved,       setSaved]       = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  const form = useForm<SettingsFormValues>({ resolver: zodResolver(settingsSchema) });

  useEffect(() => {
    if (!pageant) return;
    form.reset({
      name:        pageant.name,
      slug:        pageant.slug,
      description: pageant.description ?? "",
      logoUrl:     pageant.logoUrl ?? "",
      venue:       pageant.venue ?? "",
      eventDate:   pageant.eventDate ?? "",
      startTime:   toTimeInput(pageant.startTime),
      endTime:     toTimeInput(pageant.endTime),
      isPublic:    pageant.isPublic,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageant?.id]);

  async function onSave(data: SettingsFormValues) {
    setSaved(false);
    try {
      await updateMutation.mutateAsync({
        name:        data.name,
        slug:        data.slug,
        description: data.description || null,
        logoUrl:     data.logoUrl || null,
        venue:       data.venue || null,
        eventDate:   data.eventDate || null,
        startTime:   data.startTime || null,
        endTime:     data.endTime || null,
        isPublic:    data.isPublic,
      });
      toast.success("Settings saved.");
      setSaved(true);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.userMessage : "Failed to save settings.");
    }
  }

  async function onArchive() {
    try {
      await archiveMutation.mutateAsync(pageantId);
      toast.success(`"${pageant?.name}" archived.`);
      router.replace("/org_owner/pageants");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.userMessage : "Failed to archive pageant.");
    }
  }

  async function onPublish() {
    try {
      await publishMutation.mutateAsync();
      setShowPublish(false);
      toast.success(`"${pageant?.name}" is now published. Its coordinator can open the dashboard.`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.userMessage : "Failed to publish pageant.");
    }
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <OrgPageShell title="Settings" breadcrumbs={[
        { label: "Pageants", href: "/org_owner/pageants" },
        { label: "…", href: "#" },
        { label: "Settings" },
      ]}>
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 bg-surface border border-border animate-pulse" />
          ))}
        </div>
      </OrgPageShell>
    );
  }

  if (isError || !pageant) {
    return (
      <OrgPageShell title="Settings" breadcrumbs={[{ label: "Pageants", href: "/org_owner/pageants" }]}>
        <p className="text-small text-muted">Pageant not found.</p>
      </OrgPageShell>
    );
  }

  const { formState: { errors, isSubmitting } } = form;

  return (
    <OrgPageShell
      title="Settings"
      subtitle={pageant.name}
      breadcrumbs={[
        { label: "Pageants",     href: "/org_owner/pageants" },
        { label: pageant.name,   href: `/org_owner/pageants/${pageantId}` },
        { label: "Settings" },
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

        <Section title="Pageant status" description="Publishing makes the coordinator dashboard available for this pageant.">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-small font-semibold text-charcoal">Current status: {pageant.status.toUpperCase()}</p>
              <p className="mt-1 max-w-2xl text-caption leading-relaxed text-muted">
                {pageant.status.toUpperCase() === "DRAFT"
                  ? "The assigned coordinator cannot open the dashboard until you publish this pageant. Public visibility is controlled separately below."
                  : "This pageant has been published. Public visibility is controlled separately in General settings."}
              </p>
            </div>
            {pageant.status.toUpperCase() === "DRAFT" ? (
              <Button type="button" variant="secondary" size="sm" onClick={() => setShowPublish(true)} loading={publishMutation.isPending}>
                Publish pageant
              </Button>
            ) : <span className="inline-flex items-center border border-success/25 bg-success/5 px-3 py-2 text-xs font-semibold text-success">Published</span>}
          </div>
        </Section>

        {/* ── General ──────────────────────────────────────────────────── */}
        <Section title="General" description="Name, slug, description, and visibility settings.">
          <form onSubmit={form.handleSubmit(onSave)} noValidate className="space-y-5">

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={<>Name <span className="text-error">*</span></>} error={errors.name?.message}>
                <input type="text" className={fieldInput} {...form.register("name")} />
              </Field>
              <Field label={<>Slug <span className="text-error">*</span></>} error={errors.slug?.message}
                hint="Lowercase letters, numbers, hyphens">
                <input type="text" className={fieldInput} {...form.register("slug")} />
              </Field>
            </div>

            <Field label="Description" error={errors.description?.message}>
              <textarea className={fieldTextarea} {...form.register("description")} />
            </Field>

            <Field label="Pageant image" hint="Optional · PNG, JPG, or WebP up to 10 MB">
              <CloudinaryImageUpload
                folder="pageant-images"
                value={form.watch("logoUrl")}
                label="Upload pageant image"
                onUploadingChange={setImageUploading}
                onChange={(url) => form.setValue("logoUrl", url, { shouldDirty: true, shouldValidate: true })}
              />
            </Field>

            <div className="flex items-center gap-3 py-3 px-4 bg-slate/30 border border-border">
              <input type="checkbox" id="settings-public" {...form.register("isPublic")}
                className="w-4 h-4 accent-navy shrink-0" />
              <label htmlFor="settings-public" className="text-small text-charcoal cursor-pointer">
                Make this pageant publicly visible to the audience
              </label>
            </div>

            <div className="flex items-center gap-3 pt-2 border-t border-border">
              <Button type="submit" variant="secondary" size="sm" loading={isSubmitting} disabled={imageUploading}>
                Save Changes
              </Button>
              <Button type="button" variant="ghost" size="sm" disabled={isSubmitting}
                onClick={() => { form.reset(); setSaved(false); }}>
                Discard
              </Button>
              {saved && !isSubmitting && (
                <span className="text-small text-success flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Saved
                </span>
              )}
            </div>
          </form>
        </Section>

        {/* ── Schedule ─────────────────────────────────────────────────── */}
        <Section title="Schedule" description="Event date, venue, and timings.">
          <form onSubmit={form.handleSubmit(onSave)} noValidate className="space-y-5">
            <Field label="Venue" error={errors.venue?.message}>
              <input type="text" placeholder="e.g. Smart Araneta Coliseum, Quezon City"
                className={fieldInput} {...form.register("venue")} />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Event Date">
                <input type="date" className={fieldInput} {...form.register("eventDate")} />
              </Field>
              <Field label="Start Time" hint="Can be past midnight">
                <input type="time" className={fieldInput} {...form.register("startTime")} />
              </Field>
              <Field label="End Time" hint="Can be past midnight">
                <input type="time" className={fieldInput} {...form.register("endTime")} />
              </Field>
            </div>
            <div className="flex items-center gap-3 pt-2 border-t border-border">
              <Button type="submit" variant="secondary" size="sm" loading={isSubmitting} disabled={imageUploading}>
                Save Schedule
              </Button>
            </div>
          </form>
        </Section>

        {/* ── Danger Zone ──────────────────────────────────────────────── */}
        <section className="border border-error/40 overflow-hidden">
          {/* Red header */}
          <div className="bg-error/10 border-b border-error/30 px-5 py-4 sm:px-6">
            <h2 className="font-serif font-bold text-error text-h3">Danger Zone</h2>
            <p className="text-small text-muted mt-0.5">
              Destructive actions — these cannot be undone from the dashboard.
            </p>
          </div>

          <div className="px-5 py-5 sm:px-6 space-y-4 bg-surface">
            {/* Archive row */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border border-error/20 bg-error/3">
              <div>
                <p className="text-small font-semibold text-charcoal">Archive this pageant</p>
                <p className="text-caption text-muted mt-0.5 leading-relaxed">
                  Only an untouched pageant can be archived. Once staff, rounds, or categories are added, the pageant is locked and continues to use one pageant slot.
                </p>
              </div>
              <Button
                variant="danger"
                size="sm"
                className="shrink-0 self-start sm:self-auto"
                onClick={() => setShowArchive(true)}
                disabled={pageant.status === "archived" || archiveMutation.isPending}
              >
                {pageant.status === "archived" ? "Already Archived" : "Archive Pageant"}
              </Button>
            </div>
          </div>
        </section>

      </div>

      {/* Archive confirm modal */}
      <ConfirmModal
        open={showArchive}
        onClose={() => setShowArchive(false)}
        onConfirm={onArchive}
        title="Archive Pageant"
        description={`Archive "${pageant.name}"? Only untouched pageants can be archived. Configured pageants keep their plan slot.`}
        confirmLabel="Archive"
        loading={archiveMutation.isPending}
        destructive
      />

      <ConfirmModal
        open={showPublish}
        onClose={() => setShowPublish(false)}
        onConfirm={onPublish}
        title="Publish Pageant"
        description={`Publish "${pageant.name}"? The assigned coordinator will be able to open and manage its dashboard. Public visibility will still follow the setting you choose above.`}
        confirmLabel="Publish pageant"
        loading={publishMutation.isPending}
      />

    </OrgPageShell>
  );
}
