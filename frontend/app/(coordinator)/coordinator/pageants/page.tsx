"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MdArrowForward, MdCalendarMonth, MdLocationOn, MdSearch, MdStar } from "react-icons/md";
import { Button } from "@/src/components/ui/Button";
import { useAssignedPageants } from "@/src/features/coordinator/hooks/usePageants";
import CoordinatorHeader from "@/src/features/coordinator/components/CoordinatorHeader";

function displayDate(value: string | null) {
  if (!value) return "Date to be announced";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}

function statusLabel(value: string) {
  return value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function CoordinatorPageantsPage() {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 9;
  const { data: pageants = [], isLoading, isError, refetch } = useAssignedPageants();
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return pageants.filter((pageant) => !term || `${pageant.name} ${pageant.organizationName ?? ""} ${pageant.venue ?? ""}`.toLowerCase().includes(term));
  }, [pageants, search]);
  const liveCount = pageants.filter((pageant) => pageant.status.toLowerCase() === "live").length;
  const nextEvent = pageants.find((pageant) => pageant.eventDate && new Date(pageant.eventDate) >= new Date());
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visiblePageants = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="min-h-screen bg-[#f6f6f3]">
      <CoordinatorHeader />

      <section className="relative isolate overflow-hidden border-b border-gold/25 bg-navy py-14 text-white sm:py-16">
        <div className="container-page relative">
          <div className="pointer-events-none absolute -right-10 -top-36 -z-10 h-[420px] w-[420px] rounded-full border border-gold/10" />
          <div className="pointer-events-none absolute -right-2 -top-28 -z-10 h-[330px] w-[330px] rounded-full border border-gold/10" />
          <p className="mb-4 flex items-center gap-2 text-caption font-semibold uppercase tracking-[0.18em] text-gold"><MdStar className="text-sm" /> Coordinator workspace</p>
          <h1 className="mb-4 max-w-3xl font-serif text-[1.625rem] font-bold leading-tight sm:text-[1.875rem] lg:text-[2.25rem]">Your assigned pageants</h1>
          <p className="mb-8 max-w-xl text-small leading-relaxed text-white/55">Open an event workspace to manage its contestants, rounds, categories, and staff.</p>
          <div className="flex flex-wrap gap-x-8 gap-y-4">
            <div><p className="font-serif text-2xl font-semibold text-gold">{pageants.length}</p><p className="mt-1 text-[11px] uppercase tracking-[0.15em] text-white/45">Assigned</p></div>
            <div><p className="font-serif text-2xl font-semibold text-gold">{liveCount}</p><p className="mt-1 text-[11px] uppercase tracking-[0.15em] text-white/45">Live now</p></div>
            <div><p className="font-serif text-lg font-semibold text-white">{nextEvent ? displayDate(nextEvent.eventDate) : "—"}</p><p className="mt-1 text-[11px] uppercase tracking-[0.15em] text-white/45">Next event</p></div>
          </div>
        </div>
      </section>

      <section className="sticky top-[76px] z-10 border-b border-border bg-surface py-5">
        <div className="container-page">
          <label className="relative block max-w-md">
            <MdSearch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setCurrentPage(1); }} placeholder="Search assigned pageants by name or venue…" aria-label="Search assigned pageants" className="w-full border border-border bg-slate py-2.5 pl-10 pr-4 text-small text-charcoal outline-none transition-colors placeholder:text-muted/60 focus:border-navy" />
          </label>
        </div>
      </section>

      <section className="bg-slate py-10 sm:py-12">
        <div className="container-page">
          <p className="mb-6 text-caption text-muted" aria-live="polite">{isLoading ? "Loading assigned pageants…" : search ? `${filtered.length} result${filtered.length !== 1 ? "s" : ""} for “${search}”` : `${filtered.length} assigned pageant${filtered.length !== 1 ? "s" : ""}`}</p>

          {isLoading ? <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="animate-pulse overflow-hidden border border-border bg-white"><div className="h-52 bg-slate/60" /><div className="space-y-3 p-5"><div className="h-4 w-2/3 bg-slate/60" /><div className="h-3 w-1/2 bg-slate/40" /><div className="h-10 bg-slate/40" /></div></div>)}</div> : null}

          {isError ? <div className="mt-6 border border-red-200 bg-white p-8 text-center"><p className="font-semibold text-red-700">We couldn’t load your pageants.</p><p className="mt-1 text-sm text-muted">Check your connection and try again.</p><button onClick={() => void refetch()} className="mt-4 text-sm font-semibold text-navy underline">Try again</button></div> : null}

          {!isLoading && !isError && filtered.length > 0 ? <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visiblePageants.map((pageant) => (
              <article key={pageant.id} className={`group flex flex-col overflow-hidden rounded-sm bg-surface transition-transform duration-200 ${pageant.status.toUpperCase() === "DRAFT" ? "opacity-90" : "hover:-translate-y-[3px]"}`}>
                <div className="relative h-48 overflow-hidden bg-gradient-to-br from-navy via-navy/90 to-gold/40">
                  {pageant.logoUrl ? <Image src={pageant.logoUrl} alt={`${pageant.name} event artwork`} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" /> : <div className="absolute inset-0 flex items-center justify-center"><span className="font-serif text-8xl font-semibold text-white/10">{pageant.name.slice(0, 1).toUpperCase()}</span><div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-navy/80 to-transparent" /></div>}
                  <span className="absolute right-3 top-3 bg-navy/70 px-2.5 py-1 text-caption font-semibold text-white">{statusLabel(pageant.status)}</span>
                  <span className="absolute bottom-3 left-4 text-caption font-semibold uppercase tracking-widest text-gold/90">Assigned event</span>
                </div>
                <div className="flex flex-1 flex-col gap-3 px-5 py-5">
                  <p className="text-caption font-semibold uppercase tracking-[0.14em] text-gold/80">{pageant.organizationName ?? "Assigned organization"}</p>
                  <h3 className="font-serif text-h3 font-bold leading-snug text-charcoal">{pageant.name}</h3>
                  <div className="mt-auto space-y-1.5 pt-1 text-small text-muted">
                    <p className="flex items-center gap-2"><MdCalendarMonth className="text-base text-navy/60" />{displayDate(pageant.eventDate)}</p>
                    <p className="flex items-center gap-2"><MdLocationOn className="text-base text-navy/60" />{pageant.venue || "Venue to be announced"}</p>
                  </div>
                </div>
                <div className="px-5 pb-5 pt-0">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                    <span className="text-caption text-muted">{pageant.status.toUpperCase() === "DRAFT" ? "Dashboard access" : "Coordinator access"}</span>
                    {pageant.status.toUpperCase() === "DRAFT" ? (
                      <div className="text-right">
                        <Button variant="secondary" size="sm" disabled title="Available after the pageant is published">Open dashboard <MdArrowForward className="ml-1 inline text-sm" /></Button>
                        <p className="mt-2 max-w-52 text-xs leading-relaxed text-muted">Available after the organization publishes this pageant.</p>
                      </div>
                    ) : (
                      <Link href={`/coordinator/pageants/${pageant.id}`}><Button variant="secondary" size="sm">Open dashboard <MdArrowForward className="ml-1 inline text-sm" /></Button></Link>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div> : null}

          {!isLoading && !isError && filtered.length === 0 ? <div className="border border-dashed border-border bg-surface px-6 py-16 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-navy/5 text-navy"><MdCalendarMonth className="text-2xl" /></div><h3 className="mt-4 font-serif text-h2 font-bold text-charcoal">{search ? "No pageants match your search" : "No pageants assigned yet"}</h3><p className="mx-auto mt-2 max-w-md text-small leading-6 text-muted">{search ? "Try a different search term." : "When an organization assigns you to a pageant, it will appear here."}</p></div> : null}

          {!isLoading && !isError && filtered.length > pageSize ? <nav aria-label="Assigned pageant pages" className="mt-10 flex items-center justify-center gap-4">
            <Button variant="ghost" size="sm" disabled={currentPage <= 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}>Previous</Button>
            <span className="text-small text-muted" aria-live="polite">Page {currentPage} of {pageCount}</span>
            <Button variant="ghost" size="sm" disabled={currentPage >= pageCount} onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))}>Next</Button>
          </nav> : null}
        </div>
      </section>
    </div>
  );
}
