"use client";

import { useEffect, useState } from "react";
import { useUpdateAssignedPageant } from "../../hooks/usePageants";
import type { PageantResponse } from "@/src/types";
import { ApiError } from "@/src/lib/api/client";
import { useToast } from "@/src/components/ui/Toast";
import { CloudinaryImageUpload } from "@/src/components/ui/CloudinaryImageUpload";

const inputClass = "mt-1 h-11 w-full border border-border bg-white px-3 text-sm text-charcoal outline-none focus:border-navy";

export default function CoordinatorPageantSettings({ pageant }: { pageant: PageantResponse }) {
  const update = useUpdateAssignedPageant(pageant.id);
  const { toast } = useToast();
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [form, setForm] = useState({
    name: pageant.name,
    slug: pageant.slug,
    description: pageant.description ?? "",
    logoUrl: pageant.logoUrl ?? "",
    eventDate: pageant.eventDate?.slice(0, 10) ?? "",
    startTime: pageant.startTime?.slice(0, 5) ?? "",
    endTime: pageant.endTime?.slice(0, 5) ?? "",
    venue: pageant.venue ?? "",
    isPublic: pageant.isPublic,
  });

  useEffect(() => {
    setForm({
      name: pageant.name,
      slug: pageant.slug,
      description: pageant.description ?? "",
      logoUrl: pageant.logoUrl ?? "",
      eventDate: pageant.eventDate?.slice(0, 10) ?? "",
      startTime: pageant.startTime?.slice(0, 5) ?? "",
      endTime: pageant.endTime?.slice(0, 5) ?? "",
      venue: pageant.venue ?? "",
      isPublic: pageant.isPublic,
    });
  }, [pageant]);

  function setField<K extends keyof typeof form>(field: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await update.mutateAsync({
        name: form.name.trim(),
        slug: form.slug.trim().toLowerCase(),
        description: form.description.trim() || null,
        logoUrl: form.logoUrl.trim() || null,
        eventDate: form.eventDate || null,
        startTime: form.startTime || null,
        endTime: form.endTime || null,
        venue: form.venue.trim() || null,
        isPublic: form.isPublic,
      });
      toast.success("Pageant settings saved.");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.userMessage : "Could not save pageant settings.");
    }
  }

  return <section className="border border-border bg-white p-5 sm:p-7">
    <div className="mb-6 border-b border-border pb-5"><h2 className="font-serif text-xl font-semibold text-charcoal">Pageant settings</h2><p className="mt-1 text-sm text-muted">Update event details and public visibility.</p></div>
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="text-xs font-semibold text-charcoal">Pageant name<input required maxLength={200} value={form.name} onChange={(event) => setField("name", event.target.value)} className={inputClass} /></label>
        <label className="text-xs font-semibold text-charcoal">Pageant URL slug<input required minLength={3} maxLength={100} value={form.slug} onChange={(event) => setField("slug", event.target.value)} className={inputClass} /></label>
        <label className="text-xs font-semibold text-charcoal">Event date<input type="date" value={form.eventDate} onChange={(event) => setField("eventDate", event.target.value)} className={inputClass} /></label>
        <label className="text-xs font-semibold text-charcoal">Venue<input value={form.venue} onChange={(event) => setField("venue", event.target.value)} className={inputClass} /></label>
        <label className="text-xs font-semibold text-charcoal">Start time<input type="time" value={form.startTime} onChange={(event) => setField("startTime", event.target.value)} className={inputClass} /></label>
        <label className="text-xs font-semibold text-charcoal">End time<input type="time" value={form.endTime} onChange={(event) => setField("endTime", event.target.value)} className={inputClass} /></label>
      </div>
      <div className="space-y-2">
        <p className="text-xs font-semibold text-charcoal">Pageant image</p>
        <CloudinaryImageUpload
          value={form.logoUrl || null}
          onChange={(url) => setField("logoUrl", url)}
          onUploadingChange={setIsUploadingImage}
          folder="pageant-images"
          label="Upload pageant image"
        />
        <p className="text-xs text-muted">The image preview appears here after upload. It will be saved with the pageant settings.</p>
      </div>
      <label className="block text-xs font-semibold text-charcoal">Description<textarea rows={4} maxLength={5000} value={form.description} onChange={(event) => setField("description", event.target.value)} className="mt-1 w-full border border-border bg-white p-3 text-sm text-charcoal outline-none focus:border-navy" /></label>
      <label className="flex items-start gap-3 border border-border p-4"><input type="checkbox" checked={form.isPublic} onChange={(event) => setField("isPublic", event.target.checked)} className="mt-1 accent-navy" /><span><span className="block text-sm font-semibold text-charcoal">Show this pageant publicly</span><span className="mt-1 block text-xs text-muted">Public pageants can appear in Votex’s event listings.</span></span></label>
      <div className="flex justify-end"><button type="submit" disabled={update.isPending || isUploadingImage} className="bg-navy px-5 py-3 text-sm font-semibold text-white hover:bg-[#1b3559] disabled:opacity-50">{isUploadingImage ? "Uploading image…" : update.isPending ? "Saving…" : "Save settings"}</button></div>
    </form>
  </section>;
}
