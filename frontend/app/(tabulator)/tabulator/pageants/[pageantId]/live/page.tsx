"use client";

import Image from "next/image";
import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { MdArrowBack, MdEmojiEvents, MdEvent, MdLocationOn, MdOutlineCategory } from "react-icons/md";
import { useTabulatorCategories, useTabulatorPageants, useTabulatorRounds, useTabulatorLeaderboard } from "@/src/features/tabulator/hooks/useTabulatorPageants";
import type { TabulatorLeaderboardEntry } from "@/src/features/tabulator/api/tabulator";

type Standing = {
  id: string;
  number: number;
  name: string;
  gender: "female" | "male";
  photoUrl: string | null;
  status: string;
  score: number | null;
  categoriesScored: number;
};

const allowedPageantStatuses = ["PUBLISHED", "ONGOING", "COMPLETED"];

function formatDate(value: string | null) {
  if (!value) return "Date to be announced";
  return new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(new Date(`${value}T00:00:00`));
}

function displayStatus(status: string) {
  if (status === "REGISTERED" || status === "QUALIFIED") return "Active";
  return status.charAt(0) + status.slice(1).toLowerCase().replaceAll("_", " ");
}

function statusClasses(status: string) {
  if (status === "DISQUALIFIED") return "border-error/25 bg-error/10 text-error";
  if (status === "ELIMINATED" || status === "WITHDRAWN") return "border-slate-300 bg-slate-100 text-slate-700";
  if (status === "ADVANCED") return "border-gold/40 bg-gold/15 text-[#765700]";
  return "border-emerald-200 bg-emerald-50 text-emerald-800";
}

function CandidatePhoto({ photoUrl, name }: { photoUrl: string | null; name: string }) {
  return <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-gold/50 bg-navy/5 sm:h-[72px] sm:w-[72px]">
    {photoUrl ? <Image src={photoUrl} alt={`${name} photo`} fill sizes="72px" className="object-cover" /> : <span className="flex h-full w-full items-center justify-center font-serif text-xl font-bold text-navy">{name.charAt(0).toUpperCase()}</span>}
  </div>;
}

function StandingList({ title, rows, loading }: { title: string; rows: Standing[]; loading: boolean }) {
  return <section className="min-w-0 overflow-hidden border border-border bg-white shadow-sm">
    <header className="flex items-center justify-between border-b border-border bg-slate/30 px-4 py-3 sm:px-5"><h3 className="font-serif text-lg font-semibold text-navy">{title}</h3><span className="text-xs text-muted">{rows.length} contestants</span></header>
    {loading ? <div className="space-y-3 p-5">{[1, 2, 3].map((item) => <div key={item} className="h-24 animate-pulse bg-slate/60" />)}</div> : rows.length === 0 ? <p className="p-6 text-sm text-muted">No contestants in this division.</p> :
      <div className="divide-y divide-border">{rows.map((row, index) => {
        const rank = row.score === null ? null : rows.slice(0, index).filter((item) => item.score !== null).length + 1;
        return <article key={row.id} className="grid grid-cols-[34px_64px_minmax(0,1fr)] items-center gap-3 px-3 py-4 transition-colors hover:bg-slate/20 sm:grid-cols-[38px_76px_minmax(0,1fr)_auto] sm:gap-4 sm:px-4">
          <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold tabular-nums ${rank === 1 ? "bg-gold text-navy" : rank ? "bg-navy/5 text-navy" : "bg-slate/60 text-muted"}`}>{rank ?? "—"}</span>
          <CandidatePhoto photoUrl={row.photoUrl} name={row.name} />
          <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="inline-flex bg-gold/20 px-2 py-0.5 text-[10px] font-extrabold tracking-wide text-navy">#{row.number}</span><span className={`inline-flex border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${statusClasses(row.status)}`}>{displayStatus(row.status)}</span></div><p className="mt-1 break-words font-serif text-sm font-bold leading-snug text-charcoal [overflow-wrap:anywhere] sm:text-base">{row.name}</p>{row.categoriesScored > 0 ? <p className="mt-0.5 text-[11px] text-muted">{row.categoriesScored} {row.categoriesScored === 1 ? "category" : "categories"} scored</p> : null}</div>
          <div className="col-span-3 flex items-center justify-between border-t border-border/70 pt-2 sm:col-span-1 sm:min-w-[74px] sm:block sm:border-0 sm:pt-0 sm:text-right"><p className="text-[10px] font-semibold uppercase tracking-wider text-muted">{row.score === null ? "Score" : rank === 1 ? "Leading" : "Score"}</p>{row.score === null ? <p className="mt-0.5 text-xs font-medium text-muted">Awaiting scores</p> : <p className="mt-0.5 font-serif text-lg font-bold tabular-nums text-navy sm:text-xl">{row.score.toFixed(2)}</p>}</div>
        </article>;
      })}</div>}
  </section>;
}

export default function TabulatorLivePage({ params }: { params: Promise<{ pageantId: string }> }) {
  const { pageantId } = use(params);
  const pageantsQuery = useTabulatorPageants();
  const pageant = pageantsQuery.data?.find((item) => item.id === pageantId);
  const canOpen = !!pageant && allowedPageantStatuses.includes(pageant.status.toUpperCase());
  const roundsQuery = useTabulatorRounds(pageantId, canOpen);
  const categoriesQuery = useTabulatorCategories(pageantId, canOpen);
  const rounds = [...(roundsQuery.data ?? [])].sort((a, b) => a.roundNumber - b.roundNumber);
  const [roundId, setRoundId] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  useEffect(() => { if (rounds.length && !rounds.some((round) => round.id === roundId)) setRoundId(rounds[0].id); }, [rounds, roundId]);
  const selectedRound = rounds.find((round) => round.id === roundId);
  const categories = (categoriesQuery.data ?? []).filter((category) => category.roundId === roundId && category.isActive);
  const leaderboardQuery = useTabulatorLeaderboard(pageantId, roundId, canOpen);
  const entries = leaderboardQuery.data ?? [];

  const standings = useMemo(() => {
    const grouped = new Map<string, TabulatorLeaderboardEntry[]>();
    entries.forEach((entry) => { const values = grouped.get(entry.contestantId) ?? []; values.push(entry); grouped.set(entry.contestantId, values); });
    return [...grouped.entries()].flatMap(([id, items]) => {
      const first = items[0];
      const applicable = categoryId === "all" ? items.filter((item) => item.categoryId) : items.filter((item) => item.categoryId === categoryId);
      if (categoryId !== "all" && applicable.length === 0) return [];
      const scored = applicable.filter((item) => item.score !== null);
      const score = applicable.length > 0 && scored.length === applicable.length
        ? scored.reduce((sum, item) => sum + Number(item.score) * (categoryId === "all" ? Number(item.categoryWeight ?? 0) / 100 : 1), 0)
        : null;
      return [{ id, number: first.contestantNumber, name: first.contestantName, photoUrl: first.photoUrl, gender: first.gender?.toLowerCase() === "male" ? "male" as const : "female" as const, status: first.contestantStatus, score, categoriesScored: scored.length }];
    }).sort((a, b) => (b.score ?? -1) - (a.score ?? -1) || a.number - b.number);
  }, [entries, categoryId]);
  const female = standings.filter((item) => item.gender === "female");
  const male = standings.filter((item) => item.gender === "male");
  const winner = standings.find((entry) => entry.score !== null);
  const categoryWinners = categories.map((category) => {
    const top = entries
      .filter((entry) => entry.categoryId === category.id && entry.score !== null)
      .sort((a, b) => Number(b.score) - Number(a.score) || a.contestantNumber - b.contestantNumber)[0];
    return { category, top };
  });
  const loading = pageantsQuery.isLoading || (canOpen && (roundsQuery.isLoading || categoriesQuery.isLoading));
  const error = pageantsQuery.isError || (canOpen && (roundsQuery.isError || categoriesQuery.isError));

  return <div className="min-h-full pb-12">
    <section className="relative isolate overflow-hidden border-b border-gold/25 bg-navy py-9 text-white sm:py-12"><div className="pointer-events-none absolute -right-16 -top-24 -z-10 h-72 w-72 rounded-full border border-gold/10" /><div className="container-page relative">
      <Link href="/tabulator" className="inline-flex items-center gap-1.5 text-xs font-medium text-white/65 transition hover:text-gold"><MdArrowBack /> Back to assigned pageants</Link>
      <div className="mt-6 flex flex-col justify-between gap-5 sm:flex-row sm:items-center"><div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">Tabulation results</p><h1 className="mt-2 break-words font-serif text-3xl font-bold leading-tight sm:text-4xl">{pageant?.name ?? (pageantsQuery.isLoading ? "Loading pageant…" : "Pageant workspace")}</h1>{pageant ? <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/60"><span>{pageant.organizationName}</span>{pageant.eventDate ? <span className="inline-flex items-center gap-1.5"><MdEvent className="text-gold" />{formatDate(pageant.eventDate)}</span> : null}{pageant.venue ? <span className="inline-flex items-center gap-1.5"><MdLocationOn className="text-gold" />{pageant.venue}</span> : null}</div> : null}</div>{pageant?.logoUrl ? <Image src={pageant.logoUrl} alt={`${pageant.name} logo`} width={76} height={76} unoptimized className="h-16 w-16 shrink-0 border border-gold/40 bg-white object-cover sm:h-20 sm:w-20" /> : null}</div>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-white/65">Review submitted scores, contestant progress, category leaders, and overall standings for each round.</p>
    </div></section>

    <section className="container-page space-y-5 py-7 sm:py-9">
      {loading ? <div className="grid gap-4 md:grid-cols-2">{[0, 1].map((item) => <div key={item} className="h-64 animate-pulse border border-border bg-white" />)}</div> : null}
      {error ? <div role="alert" className="border border-error/20 bg-white p-7 text-center"><h2 className="font-serif text-lg font-bold text-charcoal">Unable to load this results workspace</h2><p className="mt-2 text-sm text-muted">Refresh the page and try again.</p><button type="button" onClick={() => { void pageantsQuery.refetch(); void roundsQuery.refetch(); void categoriesQuery.refetch(); void leaderboardQuery.refetch(); }} className="mt-4 border border-navy bg-navy px-4 py-2 text-sm font-semibold text-white">Try again</button></div> : null}
      {!loading && !error && pageantsQuery.data && !pageant ? <div className="border border-error/20 bg-white p-7 text-center"><h2 className="font-serif text-lg font-bold text-charcoal">Pageant assignment not found</h2><p className="mt-2 text-sm text-muted">This pageant is not assigned to your tabulator account.</p></div> : null}
      {!loading && !error && pageant && !canOpen ? <div className="border border-amber-200 bg-amber-50 p-7 text-center"><h2 className="font-serif text-lg font-bold text-charcoal">This pageant is not open yet</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted">Results become available after the pageant is published. You can return when the organizer opens it.</p><Link href="/tabulator" className="mt-4 inline-flex text-sm font-semibold text-navy underline">Back to assigned pageants</Link></div> : null}
      {!loading && !error && canOpen && rounds.length === 0 ? <div className="border border-border bg-white px-6 py-12 text-center"><MdEvent className="mx-auto text-2xl text-gold" /><h2 className="mt-4 font-serif text-xl font-bold text-charcoal">No rounds are set up</h2><p className="mt-2 text-sm text-muted">The pageant coordinator has not added any rounds yet.</p></div> : null}

      {!loading && !error && canOpen && rounds.length > 0 ? <>
        <section className="border border-border bg-white p-4 shadow-sm sm:p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <label className="min-w-0 flex-1 text-xs font-semibold uppercase tracking-wider text-muted">Round<select value={roundId} onChange={(event) => { setRoundId(event.target.value); setCategoryId("all"); }} className="mt-2 block h-11 w-full border border-border bg-white px-3 text-sm font-medium normal-case tracking-normal text-charcoal outline-none focus:border-navy">{rounds.map((round) => <option key={round.id} value={round.id}>{round.name} · {round.status.toLowerCase()}</option>)}</select></label>
          <label className="min-w-0 flex-1 text-xs font-semibold uppercase tracking-wider text-muted">Standings<select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className="mt-2 block h-11 w-full border border-border bg-white px-3 text-sm font-medium normal-case tracking-normal text-charcoal outline-none focus:border-navy"><option value="all">Overall weighted round score</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name} · {category.status.toLowerCase()}</option>)}</select></label>
        </div>{selectedRound ? <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3 text-xs text-muted"><span className="inline-flex items-center gap-1.5"><MdOutlineCategory className="text-gold" />{categories.length} categories</span><span className="text-border">•</span><span>{selectedRound.status.toLowerCase()} round</span><span className="ml-auto">Only complete, submitted judge sheets count.</span></div> : null}</section>

        {leaderboardQuery.isError ? <div role="alert" className="border border-error/20 bg-error/5 p-4 text-sm text-error">Could not load round standings. Try refreshing this page.</div> : null}
        {!leaderboardQuery.isError ? <section className="flex flex-col gap-3 border border-gold/35 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#87691e]">{categoryId === "all" ? "Current round leader" : "Category winner"}</p><h2 className="mt-1 font-serif text-lg font-bold text-navy">{categoryId === "all" ? "Overall weighted standings" : categories.find((category) => category.id === categoryId)?.name ?? "Selected category"}</h2></div>{winner ? <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/20 text-[#87691e]"><MdEmojiEvents className="text-2xl" /></span><div><p className="text-sm font-bold text-charcoal">#{winner.number} · {winner.name}</p><p className="text-xs text-muted">{categoryId === "all" ? "Weighted score" : "Winning average"} {winner.score?.toFixed(2)} / 100</p></div></div> : <p className="text-sm text-muted">No complete submitted scores yet.</p>}</section> : null}
        {!leaderboardQuery.isError && categoryId === "all" && categoryWinners.length ? <section className="space-y-3"><div className="flex items-end justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#87691e]">Category results</p><h2 className="font-serif text-xl font-bold text-navy">Winners by category</h2></div><span className="text-xs text-muted">Based on submitted judge scores</span></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{categoryWinners.map(({ category, top }) => <article key={category.id} className="flex min-w-0 items-center gap-3 border border-border bg-white p-4 shadow-sm"><span className={`flex h-10 w-10 shrink-0 items-center justify-center ${top ? "bg-gold/20 text-[#87691e]" : "bg-slate/60 text-muted"}`}><MdEmojiEvents className="text-xl" /></span><div className="min-w-0 flex-1"><p className="truncate text-[10px] font-bold uppercase tracking-wide text-muted">{category.name}</p>{top ? <><p className="mt-1 truncate text-sm font-bold text-charcoal">#{top.contestantNumber} · {top.contestantName}</p><p className="mt-0.5 text-xs font-semibold tabular-nums text-navy">{Number(top.score).toFixed(2)} / 100</p></> : <p className="mt-1 text-xs text-muted">Awaiting complete submitted scores</p>}</div></article>)}</div></section> : null}
        {!leaderboardQuery.isError && categories.length > 0 ? <div className="grid gap-5 lg:grid-cols-2"><StandingList title="Female contestants" rows={female} loading={leaderboardQuery.isLoading} /><StandingList title="Male contestants" rows={male} loading={leaderboardQuery.isLoading} /></div> : null}
        {!leaderboardQuery.isError && categories.length === 0 ? <div className="border border-border bg-white p-7 text-center"><h2 className="font-serif text-lg font-bold text-charcoal">No categories in this round</h2><p className="mt-2 text-sm text-muted">Contestant score standings appear here after categories are configured.</p></div> : null}
      </> : null}
    </section>
  </div>;
}
