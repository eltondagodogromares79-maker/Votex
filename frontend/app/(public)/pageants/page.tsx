"use client";

import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/src/components/ui/Button";

// Note: metadata export is not supported in "use client" components.
// Move to a layout.tsx or a server wrapper if needed.

const FEATURED_PAGEANTS = [
  {
    id: "1",
    name: "Miss Universe Philippines 2025",
    location: "Manila, Philippines",
    date: "March 15, 2025",
    category: "National",
    status: "Upcoming",
    candidateCount: 40,
    image: "https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=600&q=80&auto=format&fit=crop",
  },
  {
    id: "2",
    name: "Binibining Pilipinas 2025",
    location: "Pasay City, Philippines",
    date: "April 20, 2025",
    category: "National",
    status: "Upcoming",
    candidateCount: 35,
    image: "https://images.unsplash.com/photo-1519671282429-b44b4b0e7a2e?w=600&q=80&auto=format&fit=crop",
  },
  {
    id: "3",
    name: "Mr. & Ms. Campus Royalty",
    location: "Cebu City, Philippines",
    date: "February 28, 2025",
    category: "Campus",
    status: "Completed",
    candidateCount: 24,
    image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&q=80&auto=format&fit=crop",
  },
  {
    id: "4",
    name: "Miss Earth Philippines",
    location: "Quezon City, Philippines",
    date: "May 10, 2025",
    category: "National",
    status: "Upcoming",
    candidateCount: 30,
    image: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=600&q=80&auto=format&fit=crop",
  },
  {
    id: "5",
    name: "Mutya ng Pilipinas",
    location: "Pasig City, Philippines",
    date: "June 5, 2025",
    category: "National",
    status: "Upcoming",
    candidateCount: 28,
    image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=600&q=80&auto=format&fit=crop",
  },
  {
    id: "6",
    name: "Little Miss Philippines",
    location: "Makati City, Philippines",
    date: "January 18, 2025",
    category: "Youth",
    status: "Completed",
    candidateCount: 20,
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80&auto=format&fit=crop",
  },
  {
    id: "7",
    name: "Ms. Senior Philippines",
    location: "Taguig City, Philippines",
    date: "July 22, 2025",
    category: "Special",
    status: "Upcoming",
    candidateCount: 18,
    image: "https://images.unsplash.com/photo-1464375117522-1311d6a5b81f?w=600&q=80&auto=format&fit=crop",
  },
  {
    id: "8",
    name: "Reyna ng Bayan 2025",
    location: "Davao City, Philippines",
    date: "August 30, 2025",
    category: "Regional",
    status: "Upcoming",
    candidateCount: 22,
    image: "https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?w=600&q=80&auto=format&fit=crop",
  },
  {
    id: "9",
    name: "Miss Intercontinental PH",
    location: "Mandaluyong, Philippines",
    date: "September 14, 2025",
    category: "National",
    status: "Live",
    candidateCount: 25,
    image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&q=80&auto=format&fit=crop",
  },
];

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  Upcoming:  { bg: "bg-navy/70",    text: "text-white" },
  Live:      { bg: "bg-gold",       text: "text-navy" },
  Completed: { bg: "bg-surface/70", text: "text-charcoal" },
};

export default function PageantsPage() {
  const [query, setQuery] = useState("");

  const filtered = FEATURED_PAGEANTS.filter((p) =>
    [p.name, p.location, p.category].some((field) =>
      field.toLowerCase().includes(query.toLowerCase()),
    ),
  );

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
          <Link href="/register">
            <Button variant="secondary" size="md">
              Run your pageant on Votex
            </Button>
          </Link>
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
              onChange={(e) => setQuery(e.target.value)}
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
            {query
              ? `${filtered.length} result${filtered.length !== 1 ? "s" : ""} for "${query}"`
              : `${filtered.length} pageants`}
          </p>

          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-caption font-semibold uppercase tracking-[0.16em] text-gold mb-3">
                No results
              </p>
              <p className="font-serif font-bold text-charcoal text-h2 mb-2">
                No pageants found
              </p>
              <p className="text-small text-muted">
                Try a different search term.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((pageant) => {
                const statusStyle = STATUS_STYLES[pageant.status] ?? STATUS_STYLES["Upcoming"];
                return (
                  <div
                    key={pageant.id}
                    className="bg-surface rounded-sm overflow-hidden flex flex-col
                               hover:translate-y-[-3px] transition-transform duration-200"
                  >
                    {/* Photo with status badge */}
                    <div className="relative h-48 overflow-hidden">
                      <Image
                        src={pageant.image}
                        alt={pageant.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover object-center transition-transform
                                   duration-500 hover:scale-105"
                      />
                      {/* Subtle gradient at bottom so text overlays are readable */}
                      <div className="absolute inset-0
                                      bg-gradient-to-t from-navy/70 via-transparent to-transparent" />

                      {/* Status badge — top right */}
                      <span className={`absolute top-3 right-3 text-caption font-semibold
                                        px-2.5 py-1 ${statusStyle.bg} ${statusStyle.text}`}>
                        {pageant.status}
                      </span>

                      {/* Category — bottom left over image */}
                      <span className="absolute bottom-3 left-4 text-caption font-semibold
                                       uppercase tracking-widest text-gold/90">
                        {pageant.category}
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
                          {pageant.location}
                        </div>
                        <div className="flex items-center gap-2 text-small text-muted">
                          <span className="text-gold/60 shrink-0" aria-hidden="true">✦</span>
                          {pageant.date}
                        </div>
                        <div className="flex items-center gap-2 text-small text-muted">
                          <span className="text-gold/60 shrink-0" aria-hidden="true">✦</span>
                          {pageant.candidateCount} candidates
                        </div>
                      </div>
                    </div>

                    {/* Card footer */}
                    <div className="px-5 pb-5 pt-0">
                      <div className="border-t border-border pt-4
                                      flex items-center justify-between">
                        <span className="text-caption text-muted">Powered by Votex</span>
                        <Link href="/register">
                          <Button variant="secondary" size="sm">
                            View now
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
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
            <Link href="/register">
              <Button variant="secondary" size="md">Get started free</Button>
            </Link>
            <Link href="/pricing">
              <Button variant="ghost" size="md"
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
