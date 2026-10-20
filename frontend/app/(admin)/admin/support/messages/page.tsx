"use client";

import { useEffect, useState } from "react";
import AdminPageShell from "@/src/features/admin/components/AdminPageShell";
import { contactApi, type ContactMessage } from "@/src/features/contact/api/contact";
import { Button } from "@/src/components/ui/Button";

export default function AdminContactMessagesPage() {
  const [items, setItems] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  useEffect(() => {
    let active = true;
    setLoading(true);
    contactApi.listForAdmin({ limit, offset })
      .then((page) => { if (active) { setItems(page.items); setError(null); } })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : "Could not load contact messages."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [offset]);

  return (
    <AdminPageShell title="Contact messages" subtitle="Questions and support requests submitted by signed-in users.">
      <section className="space-y-4">
        {error ? <div role="alert" className="border border-error/25 bg-error/5 px-4 py-3 text-small text-error">{error}</div> : null}
        {loading ? <div className="rounded-sm border border-border bg-surface p-8 text-center text-small text-muted">Loading contact messages…</div> : null}
        {!loading && !error && items.length === 0 ? <div className="rounded-sm border border-border bg-surface p-10 text-center"><p className="font-serif text-h3 font-semibold text-charcoal">Inbox is clear</p><p className="mt-2 text-small text-muted">New contact form submissions will appear here.</p></div> : null}
        {!loading && items.map((item) => (
          <article key={item.id} className="rounded-sm border border-border bg-surface p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-gold/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-navy">{item.status.replaceAll("_", " ")}</span>
                  <time className="text-caption text-muted" dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString()}</time>
                </div>
                <h2 className="break-words font-serif text-h3 font-semibold text-charcoal">{item.subject}</h2>
                <p className="mt-1 break-words text-small text-muted">
                  {item.senderName} · <a className="text-navy underline decoration-gold/60 underline-offset-2" href={`mailto:${item.senderEmail}`}>{item.senderEmail}</a>
                </p>
              </div>
              <a href={`mailto:${item.senderEmail}?subject=${encodeURIComponent(`Re: ${item.subject}`)}`} className="inline-flex h-10 shrink-0 items-center justify-center border border-navy/20 px-4 text-xs font-semibold text-navy transition-colors hover:border-navy hover:bg-navy hover:text-white">Reply by email</a>
            </div>
            <p className="mt-5 whitespace-pre-wrap break-words border-t border-border pt-4 text-small leading-relaxed text-charcoal">{item.message}</p>
          </article>
        ))}
        {!loading && !error ? <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - limit))}>Previous</Button>
          <Button variant="ghost" size="sm" disabled={items.length < limit} onClick={() => setOffset(offset + limit)}>Next</Button>
        </div> : null}
      </section>
    </AdminPageShell>
  );
}
