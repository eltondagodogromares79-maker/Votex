"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/src/components/ui/Button";
import { PublicDashboardLink } from "@/src/features/public/components/PublicDashboardLink";
import { usePublicPageants } from "@/src/features/public/hooks/usePublicCatalog";
import type { PublicPageant } from "@/src/features/public/api/publicCatalog";

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  DRAFT: { bg: "bg-navy/70", text: "text-white" },
  PUBLISHED: { bg: "bg-navy/70", text: "text-white" },
  ONGOING: { bg: "bg-gold", text: "text-navy" },
  COMPLETED: { bg: "bg-surface/70", text: "text-charcoal" },
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Coming soon",
  PUBLISHED: "Upcoming",
  ONGOING: "Live",
  COMPLETED: "Completed",
};

export default function PageantsBrowser({ initialPageants }: { initialPageants?: PublicPageant[] }) {
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const { data: pageants = [], isLoading, isError, refetch } = usePublicPageants(initialPageants);
  const pageSize = 9;

  const filtered = pageants.filter((p) =>
    [p.name, p.venue ?? "", p.description ?? ""].some((field) =>
      field.toLowerCase().includes(query.toLowerCase().trim()),
    ),
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visiblePageants = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <>
      {/* ── Hero — untouched ──────────────────────────────────────────── */}
      <section className="bg-navy py-20">
        <div className="container-page">
          <p className="text-caption font-semibold uppercase tracking-[0.18em] text-gold mb-4">
            Featured Events
          </p>
          <h1 className="font-serif font-bold text-white
                         text-[1.625rem] sm:text-[1.875rem] lg:text-[2.25rem]
                         leading-tight mb-4">
            Pageants powered by Votex
          </h1>
          <p className="text-small text-white/55 max-w-lg leading-relaxed mb-8">
            From intimate campus competitions to national crown events — every
            pageant on Votex runs on live scoring, real-time tabulation, and
            results you can trust.
          </p>
          <PublicDashboardLink href="/register" label="Run your pageant on Votex" />
        </div>
      </section>

      <div className="h-px bg-gold/25 w-full" />

      {/* ── Search bar ────────────────────────────────────────────────── */}
      <section className="bg-surface py-5 border-b border-border sticky top-0 z-10">
        <div className="container-page">
          <div className="relative max-w-md">
            {/* Search icon */}
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}
                viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </span>
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search pageants by name, location…"
              aria-label="Search pageants"
              className="w-full pl-10 pr-4 py-2.5 rounded-sm bg-slate border border-border
                         text-small text-charcoal placeholder:text-muted/60
                         focus:outline-none focus:border-navy transition-colors"
            />
          </div>
        </div>
      </section>

      {/* ── Pageant grid ──────────────────────────────────────────────── */}
      <section className="py-12 bg-slate">
        <div className="container-page">

          {/* Result count */}
          <p className="text-caption text-muted mb-6">
            {isLoading ? "Loading public pageants…" : query
              ? `${filtered.length} result${filtered.length !== 1 ? "s" : ""} for "${query}"`
              : `${filtered.length} pageants`}
          </p>

          {isError ? (
            <div className="py-20 text-center">
              <p className="text-small text-error">Public pageants could not be loaded.</p>
              <button onClick={() => refetch()} className="mt-3 text-small font-semibold text-navy underline">Try again</button>
            </div>
          ) : isLoading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((item) => <div key={item} className="h-96 animate-pulse bg-surface" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-caption font-semibold uppercase tracking-[0.16em] text-gold mb-3">
                No results
              </p>
              <h2 className="font-serif font-bold text-charcoal text-h2 mb-2">
                No public pageants yet
              </h2>
              <p className="text-small text-muted">
                {query
                  ? "Try a different search term."
                  : "Pageants appear here when their owner enables public visibility in pageant settings."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {visiblePageants.map((pageant) => {
                const statusStyle = STATUS_STYLES[pageant.status] ?? STATUS_STYLES.PUBLISHED;
                const eventDate = pageant.eventDate
                  ? new Intl.DateTimeFormat("en-PH", { dateStyle: "long" }).format(new Date(pageant.eventDate))
                  : "Date to be announced";
                return (
                  <div
                    key={pageant.id}
                    className="bg-surface rounded-sm overflow-hidden flex flex-col
                               hover:translate-y-[-3px] transition-transform duration-200"
                  >
                    {/* Photo with status badge */}
                    <div className="relative h-48 overflow-hidden">
                      {pageant.logoUrl ? (
                        <Image src={pageant.logoUrl} alt={`Cover image for ${pageant.name}`} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" quality={75} className="object-cover object-center transition-transform duration-500 hover:scale-105" />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-navy via-navy/90 to-gold/40 px-6 text-center font-serif text-2xl font-bold text-white">{pageant.name}</div>
                      )}
                      {/* Subtle gradient at bottom so text overlays are readable */}
                      <div className="absolute inset-0
                                      bg-gradient-to-t from-navy/70 via-transparent to-transparent" />

                      {/* Status badge — top right */}
                      <span className={`absolute top-3 right-3 text-caption font-semibold
                                        px-2.5 py-1 ${statusStyle.bg} ${statusStyle.text}`}>
                        {STATUS_LABELS[pageant.status] ?? pageant.status}
                      </span>

                      {/* Category — bottom left over image */}
                      <span className="absolute bottom-3 left-4 text-caption font-semibold
                                       uppercase tracking-widest text-gold/90">
                        Featured event
                      </span>
                    </div>

                    {/* Card body */}
                    <div className="px-5 py-5 flex flex-col gap-3 flex-1">
                      <h2 className="font-serif font-bold text-charcoal text-h3 leading-snug">
                        {pageant.name}
                      </h2>

                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-small text-muted">
                          <span className="text-gold/60 shrink-0" aria-hidden="true">✦</span>
                          {pageant.venue || "Venue to be announced"}
                        </div>
                        <div className="flex items-center gap-2 text-small text-muted">
                          <span className="text-gold/60 shrink-0" aria-hidden="true">✦</span>
                          {eventDate}
                        </div>
                        <div className="flex items-center gap-2 text-small text-muted">
                          <span className="text-gold/60 shrink-0" aria-hidden="true">✦</span>
                          {pageant.contestantCount} {pageant.contestantCount === 1 ? "contestant" : "contestants"}
                        </div>
                      </div>
                    </div>

                    {/* Card footer */}
                    <div className="px-5 pb-5 pt-0">
                      <div className="border-t border-border pt-4 flex flex-wrap items-center justify-between gap-3">
                        <span className="text-caption text-muted">Powered by Votex</span>
                        <div className="flex flex-wrap items-center gap-2">
                          <Link href={`/pageants/${encodeURIComponent(pageant.slug)}`}>
                            <Button variant="secondary" size="sm">View now</Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!isLoading && !isError && filtered.length > pageSize && (
            <nav aria-label="Public pageants pages" className="mt-10 flex items-center justify-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              >
                Previous
              </Button>
              <span className="text-small text-muted" aria-live="polite">
                Page {currentPage} of {pageCount}
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={currentPage >= pageCount}
                onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))}
              >
                Next
              </Button>
            </nav>
          )}
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────── */}
      <section className="py-20 bg-navy text-center">
        <div className="container-page">
          <div className="w-8 h-px bg-gold/35 mx-auto mb-8" />
          <h2 className="font-serif font-bold text-gold text-h1 mb-4">
            Want to run your own pageant?
          </h2>
          <p className="text-small text-white/55 mb-8 max-w-md mx-auto leading-relaxed">
            Set up your event in minutes — candidates, judges, scoring
            categories, and live results all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <PublicDashboardLink href="/register" label="Get started free" />
            <Link href="/pricing">
              <Button variant="primary" size="md"
                className="text-white/60 border-white/15 hover:bg-white/8 hover:text-white">
                See pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
