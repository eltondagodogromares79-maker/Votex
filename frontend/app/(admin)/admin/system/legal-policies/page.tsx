"use client";

import { useEffect, useMemo, useState } from "react";
import AdminPageShell from "@/src/features/admin/components/AdminPageShell";
import { adminApi, type AdminLegalPolicy } from "@/src/features/admin/api/admin";
import { Button } from "@/src/components/ui/Button";

const POLICY_LABELS: Record<AdminLegalPolicy["slug"], string> = {
  terms: "Terms & Conditions",
  privacy: "Privacy Policy",
  "refund-policy": "Refund Policy",
  "cookie-policy": "Cookie Policy",
};

export default function AdminLegalPoliciesPage() {
  const [policies, setPolicies] = useState<AdminLegalPolicy[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<AdminLegalPolicy["slug"]>("terms");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const selected = useMemo(() => policies.find((policy) => policy.slug === selectedSlug), [policies, selectedSlug]);

  useEffect(() => {
    let active = true;
    adminApi.listLegalPolicies()
      .then((result) => { if (active) { setPolicies(result); setError(null); } })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : "Could not load legal policies."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function savePolicy(formData: FormData) {
    if (!selected) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await adminApi.updateLegalPolicy(selected.slug, {
        title: String(formData.get("title") ?? ""),
        intro: String(formData.get("intro") ?? ""),
        body: String(formData.get("body") ?? ""),
      });
      setPolicies((current) => current.map((policy) => policy.slug === updated.slug ? updated : policy));
      setNotice(`${updated.title} saved. Version ${updated.version} is now live on the public site.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save this policy.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminPageShell title="Legal policies" subtitle="Edit the terms, privacy, and refund information shown on the public website." breadcrumbs={[{ label: "Dashboard", href: "/admin/dashboard" }, { label: "System" }, { label: "Legal Policies" }]}>
      <div className="space-y-5">
        {error ? <div role="alert" className="border border-error/25 bg-error/5 px-4 py-3 text-small text-error">{error}</div> : null}
        {notice ? <div role="status" className="border border-success/25 bg-success/5 px-4 py-3 text-small text-success">{notice}</div> : null}
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Legal documents">
          {(Object.keys(POLICY_LABELS) as AdminLegalPolicy["slug"][]).map((slug) => (
            <button key={slug} type="button" role="tab" aria-selected={selectedSlug === slug} onClick={() => { setSelectedSlug(slug); setNotice(null); }} className={`rounded-sm border px-4 py-2.5 text-small font-semibold transition-colors ${selectedSlug === slug ? "border-navy bg-navy text-white" : "border-border bg-surface text-muted hover:border-navy/30 hover:text-navy"}`}>
              {POLICY_LABELS[slug]}
            </button>
          ))}
        </div>
        {loading ? <div className="border border-border bg-surface p-8 text-center text-small text-muted">Loading legal documents…</div> : null}
        {!loading && selected ? <form key={selected.slug} action={savePolicy} className="space-y-5 rounded-sm border border-border bg-surface p-5 shadow-sm sm:p-7">
          <div>
            <label htmlFor="policy-title" className="mb-1.5 block text-small font-semibold text-charcoal">Page title</label>
            <input id="policy-title" name="title" required maxLength={160} defaultValue={selected.title} className="h-11 w-full rounded-sm border border-border bg-white px-3 text-body text-charcoal outline-none focus:border-navy focus:ring-2 focus:ring-navy/10" />
          </div>
          <div>
            <label htmlFor="policy-intro" className="mb-1.5 block text-small font-semibold text-charcoal">Introduction</label>
            <textarea id="policy-intro" name="intro" maxLength={2000} rows={3} defaultValue={selected.intro} className="w-full rounded-sm border border-border bg-white px-3 py-2.5 text-body leading-relaxed text-charcoal outline-none focus:border-navy focus:ring-2 focus:ring-navy/10" />
          </div>
          <div>
            <div className="mb-1.5 flex flex-wrap items-end justify-between gap-2">
              <label htmlFor="policy-body" className="text-small font-semibold text-charcoal">Policy content</label>
              <span className="text-caption text-muted">Use ## for section headings and - for bullet points.</span>
            </div>
            <textarea id="policy-body" name="body" required maxLength={100000} rows={22} defaultValue={selected.body} className="w-full resize-y rounded-sm border border-border bg-white px-3 py-3 font-mono text-small leading-relaxed text-charcoal outline-none focus:border-navy focus:ring-2 focus:ring-navy/10" />
          </div>
          <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-caption text-muted">Current version: {selected.version}. Saving updates the public page immediately.</p>
            <Button type="submit" loading={saving}>Save and publish</Button>
          </div>
        </form> : null}
        {!loading && !selected && !error ? <div role="alert" className="border border-border bg-surface p-6 text-small text-muted">No policy records found. Apply migrations 051 and 052 to seed the legal documents.</div> : null}
      </div>
    </AdminPageShell>
  );
}
