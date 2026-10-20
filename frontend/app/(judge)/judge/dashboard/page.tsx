"use client";

import Image from "next/image";
import Link from "next/link";
import { MdArrowForward, MdEvent, MdLocationOn, MdLock } from "react-icons/md";
import { Button } from "@/src/components/ui/Button";
import { useJudgePageants } from "@/src/features/judge/hooks/useJudgePageants";

function formatDate(value: string | null) {
  if (!value) return "Date to be announced";
  return new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(new Date(`${value}T00:00:00`));
}

function canOpenPageant(status: string) {
  return ["PUBLISHED", "ONGOING", "COMPLETED"].includes(status.toUpperCase());
}

export default function JudgeDashboard() {
  const { data: pageants = [], isLoading, isError, refetch } = useJudgePageants();

  return (
    <div className="min-h-full">
      <section className="relative isolate overflow-hidden border-b border-gold/25 bg-navy py-12 text-white sm:py-16">
        <div className="pointer-events-none absolute -right-20 -top-32 -z-10 h-96 w-96 rounded-full border border-gold/10" />
        <div className="pointer-events-none absolute -right-4 -top-16 -z-10 h-64 w-64 rounded-full border border-gold/10" />
        <div className="container-page relative">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">Your judging assignments</p>
          <h1 className="mt-3 max-w-3xl font-serif text-3xl font-bold leading-tight sm:text-4xl">Welcome to your judging workspace</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-white/60">Choose an assigned pageant to review its rounds and categories.</p>
          <div className="mt-7 flex items-center gap-2 text-xs text-white/45"><span className="flex h-7 w-7 items-center justify-center rounded-full border border-gold/30 text-gold">{pageants.length}</span>assigned {pageants.length === 1 ? "pageant" : "pageants"}</div>
        </div>
      </section>

      <section className="container-page py-8 sm:py-10">
        {isLoading ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((item) => <div key={item} className="h-64 animate-pulse border border-border bg-white" />)}</div>
        ) : isError ? (
          <div className="border border-error/20 bg-white p-8 text-center">
            <h2 className="font-serif text-xl font-bold text-charcoal">We couldn’t load your pageants</h2>
            <p className="mt-2 text-sm text-muted">Check your connection and try again.</p>
            <Button className="mt-5" onClick={() => void refetch()}>Try again</Button>
          </div>
        ) : pageants.length === 0 ? (
          <div className="border border-border bg-white px-6 py-14 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-navy/5 text-gold"><MdEvent className="text-2xl" /></div>
            <h2 className="mt-5 font-serif text-xl font-bold text-charcoal">No pageants assigned yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">When an Organization Owner assigns you as a judge, the pageant will appear here.</p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {pageants.map((pageant) => (
              <article key={pageant.id} className="group flex min-h-64 flex-col border border-border bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-gold/45 hover:shadow-lg">
                <div className="relative flex h-32 items-center justify-center overflow-hidden bg-gradient-to-br from-navy to-[#1d3558]">
                  {pageant.logoUrl ? <Image src={pageant.logoUrl} alt="" fill unoptimized className="object-cover opacity-35" /> : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-navy/85 to-navy/10" />
                  <div className="relative flex h-14 w-14 items-center justify-center rounded-full border border-gold/40 bg-navy/70 font-serif text-xl font-bold text-gold">{pageant.name.trim().charAt(0).toUpperCase()}</div>
                  <span className="absolute bottom-3 left-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-gold">{pageant.organizationName}</span>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h2 className="font-serif text-lg font-bold leading-snug text-charcoal">{pageant.name}</h2>
                  <span className={`mt-2 w-fit rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${canOpenPageant(pageant.status) ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>{pageant.status.toLowerCase()}</span>
                  {pageant.description ? <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted">{pageant.description}</p> : null}
                  <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted">
                    <span className="inline-flex items-center gap-1.5"><MdEvent className="text-base text-gold" />{formatDate(pageant.eventDate)}</span>
                    {pageant.venue ? <span className="inline-flex items-center gap-1.5"><MdLocationOn className="text-base text-gold" />{pageant.venue}</span> : null}
                  </div>
                  {canOpenPageant(pageant.status) ? (
                    <Link href={`/judge/pageants/${pageant.id}/score`} className="mt-5 inline-flex min-h-10 items-center justify-between border border-navy/15 px-3 text-xs font-semibold text-navy transition-colors group-hover:border-navy group-hover:bg-navy group-hover:text-white">
                      Open judging workspace <MdArrowForward className="text-base" />
                    </Link>
                  ) : (
                    <div aria-disabled="true" className="mt-5 flex min-h-10 cursor-not-allowed items-center justify-between border border-border bg-slate-50 px-3 text-xs font-semibold text-muted">
                      <span>{pageant.status.toUpperCase() === "DRAFT" ? "Available after publication" : "Pageant unavailable"}</span><MdLock className="text-base" />
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
