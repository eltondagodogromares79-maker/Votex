"use client";

import { use } from "react";
import Link from "next/link";
import { MdArrowForward, MdEvent, MdLocationOn, MdLock, MdOutlineCategory } from "react-icons/md";
import { Button } from "@/src/components/ui/Button";
import { useJudgeCategories, useJudgePageants, useJudgeRounds } from "@/src/features/judge/hooks/useJudgePageants";

const roundColors: Record<string, string> = {
  OPEN: "border-emerald-200 bg-emerald-50 text-emerald-800",
  CLOSED: "border-slate-200 bg-slate-100 text-slate-600",
  FINALIZED: "border-amber-200 bg-amber-50 text-amber-800",
  DRAFT: "border-blue-200 bg-blue-50 text-blue-800",
};

export default function JudgeScoringPage({ params }: { params: Promise<{ pageantId: string }> }) {
  const { pageantId } = use(params);
  const pageantsQuery = useJudgePageants();
  const pageant = pageantsQuery.data?.find((item) => item.id === pageantId);
  const canOpenPageant = !!pageant && ["PUBLISHED", "ONGOING", "COMPLETED"].includes(pageant.status.toUpperCase());
  const roundsQuery = useJudgeRounds(pageantId, canOpenPageant);
  const categoriesQuery = useJudgeCategories(pageantId, canOpenPageant);
  const rounds = [...(roundsQuery.data ?? [])].sort((a, b) => a.roundNumber - b.roundNumber);
  const categories = categoriesQuery.data ?? [];
  const loading = pageantsQuery.isLoading || (canOpenPageant && (roundsQuery.isLoading || categoriesQuery.isLoading));
  const failed = pageantsQuery.isError || (canOpenPageant && (roundsQuery.isError || categoriesQuery.isError));

  return (
    <div className="min-h-full pb-12">
      <section className="relative isolate overflow-hidden border-b border-gold/25 bg-navy py-9 text-white sm:py-12">
        <div className="pointer-events-none absolute -right-20 -top-32 -z-10 h-96 w-96 rounded-full border border-gold/10" />
        <div className="pointer-events-none absolute -right-4 -top-16 -z-10 h-64 w-64 rounded-full border border-gold/10" />
        <div className="container-page relative">
          <Link href="/judge" className="inline-flex items-center gap-1.5 text-xs font-medium text-white/55 transition-colors hover:text-gold">← My pageants</Link>
          <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">Judge workspace</p>
          <h1 className="mt-2 max-w-3xl break-words font-serif text-3xl font-bold leading-tight sm:text-4xl">{pageant?.name ?? (pageantsQuery.isLoading ? "Loading pageant…" : "Pageant rounds")}</h1>
          {pageant ? <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/60"><span>{pageant.organizationName}</span>{pageant.eventDate ? <span className="inline-flex items-center gap-1.5"><MdEvent className="text-gold" />{new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(new Date(`${pageant.eventDate}T00:00:00`))}</span> : null}{pageant.venue ? <span className="inline-flex items-center gap-1.5"><MdLocationOn className="text-gold" />{pageant.venue}</span> : null}</div> : null}
          <p className="mt-4 max-w-2xl text-sm leading-6 text-white/65">Choose an open round to review its categories and submit your scores.</p>
          {pageant ? <span className="mt-4 inline-flex rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white/75">Pageant {pageant.status.toLowerCase()}</span> : null}
        </div>
      </section>

      <section className="container-page py-7 sm:py-9">
        {loading ? <div className="grid gap-4 md:grid-cols-2">{[0, 1].map((item) => <div key={item} className="h-56 animate-pulse border border-border bg-white" />)}</div> : null}
        {failed ? <div className="border border-error/20 bg-white p-7 text-center"><h2 className="font-serif text-lg font-bold text-charcoal">Unable to load the judging workspace</h2><p className="mt-2 text-sm text-muted">Refresh the page or return to your assigned pageants.</p><Button className="mt-4" onClick={() => { void pageantsQuery.refetch(); void roundsQuery.refetch(); void categoriesQuery.refetch(); }}>Try again</Button></div> : null}
        {!loading && !failed && pageantsQuery.data && !pageant ? <div className="border border-error/20 bg-white p-7 text-center"><h2 className="font-serif text-lg font-bold text-charcoal">Pageant assignment not found</h2><p className="mt-2 text-sm text-muted">This pageant is not assigned to your judge account.</p><Link href="/judge" className="mt-4 inline-flex text-sm font-semibold text-navy underline">Return to assigned pageants</Link></div> : null}
        {!loading && !failed && pageant && !canOpenPageant ? <div className="border border-amber-200 bg-amber-50/70 p-7 text-center"><div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-white text-muted"><MdLock className="text-xl" /></div><h2 className="mt-4 font-serif text-lg font-bold text-charcoal">This pageant is not available yet</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted">Judging access opens after the pageant is published.</p><Link href="/judge" className="mt-4 inline-flex text-sm font-semibold text-navy underline">Return to assigned pageants</Link></div> : null}
        {!loading && !failed && canOpenPageant && rounds.length === 0 ? <div className="border border-border bg-white px-6 py-12 text-center"><MdEvent className="mx-auto text-2xl text-gold" /><h2 className="mt-4 font-serif text-xl font-bold text-charcoal">No rounds yet</h2><p className="mt-2 text-sm text-muted">The coordinator has not added judging rounds.</p></div> : null}

        {!loading && !failed && canOpenPageant && rounds.length > 0 ? <div className="grid gap-4 lg:grid-cols-2">{rounds.map((round) => {
          const roundCategories = categories.filter((category) => category.roundId === round.id);
          const count = roundCategories.length;
          const open = round.status === "OPEN";
          return <article key={round.id} className="group flex min-h-56 flex-col overflow-hidden border border-border bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-gold/50 hover:shadow-md">
            <div className="h-1.5 bg-gradient-to-r from-navy via-navy/80 to-gold" />
            <div className="flex flex-1 flex-col p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3"><span className="inline-flex items-center gap-2 border border-border bg-slate-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted">Round {round.roundNumber}</span><span className={`rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] ${roundColors[round.status] ?? roundColors.CLOSED}`}>{round.status.toLowerCase()}</span></div>
              <h2 className="mt-4 break-words font-serif text-2xl font-bold text-charcoal">{round.name}</h2>
              <p className="mt-1 text-xs font-medium uppercase tracking-[0.12em] text-muted">{round.roundType}</p>
              <div className="mt-5 flex items-center gap-2 text-sm text-muted"><MdOutlineCategory className="text-gold" />{count} {count === 1 ? "category" : "categories"}</div>
              {roundCategories.length ? <ul className="mt-3 flex flex-wrap gap-2" aria-label={`Categories in ${round.name}`}>
                {roundCategories.map((category) => <li key={category.id} className="max-w-full break-words border border-border bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-charcoal">{category.name}</li>)}
              </ul> : <p className="mt-3 text-xs italic text-muted">No categories added yet.</p>}
              <div className="mt-auto pt-6">{open ? <Link href={`/judge/pageants/${pageantId}/score/rounds/${round.id}`} className="inline-flex w-full items-center justify-center gap-2 bg-navy px-4 py-3 text-sm font-semibold text-white transition hover:bg-navy/90">Open this round <MdArrowForward /></Link> : <button type="button" disabled className="inline-flex w-full cursor-not-allowed items-center justify-center gap-2 border border-border bg-slate-50 px-4 py-3 text-sm font-semibold text-muted"><MdLock />{round.status === "DRAFT" ? "Not open yet" : "Round closed"}</button>}</div>
            </div>
          </article>;
        })}</div> : null}
      </section>
    </div>
  );
}
