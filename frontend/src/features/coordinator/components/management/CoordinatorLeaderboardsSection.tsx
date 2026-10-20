"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { coordinatorApi, type CoordinatorLeaderboardEntry } from "../../api/coordinator";
import { useRounds } from "../../hooks/useRounds";
import { useCategories, useRoundJudgingConfiguration } from "../../hooks/useCategories";

type Props = { pageantId: string };
type CandidateStanding = { id: string; number: number; name: string; photoUrl: string | null; score: number | null; categoryCount: number };

function LeaderboardColumn({ title, rows, loading }: { title: string; rows: CandidateStanding[]; loading: boolean }) {
  return <section className="min-w-0 overflow-hidden border border-border bg-white">
    <header className="flex items-center justify-between border-b border-border bg-slate/30 px-4 py-3 sm:px-5">
      <h3 className="font-serif text-lg font-semibold text-navy">{title}</h3>
      <span className="text-xs text-muted">{rows.length} candidates</span>
    </header>
    {loading ? <div className="space-y-3 p-5">{[1, 2, 3].map((n) => <div key={n} className="h-12 animate-pulse bg-slate/60" />)}</div> : rows.length === 0 ? <p className="p-6 text-sm text-muted">No candidates in this division yet.</p> :
      <div className="divide-y divide-border">{rows.map((row, index) => {
          const rank = rows.slice(0, index).filter((item) => item.score !== null).length + 1;
          return <article key={row.id} className="grid grid-cols-[34px_52px_minmax(0,1fr)_auto] items-center gap-2.5 px-3 py-4 transition-colors hover:bg-slate/20 sm:grid-cols-[38px_60px_minmax(0,1fr)_auto] sm:gap-3 sm:px-4">
            <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold tabular-nums ${row.score === null ? "bg-slate/60 text-muted" : rank === 1 ? "bg-gold text-navy" : "bg-navy/5 text-navy"}`}>
              {row.score === null ? "—" : rank}
            </span>
            <CandidatePhoto photoUrl={row.photoUrl} name={row.name} />
            <div className="min-w-0">
              <span className="inline-flex bg-gold/20 px-2 py-0.5 text-[11px] font-extrabold tracking-wide text-navy">CONTESTANT #{row.number}</span>
              <p className="mt-1 break-words font-serif text-sm font-bold leading-snug text-charcoal [overflow-wrap:anywhere] sm:text-base">{row.name}</p>
              {row.categoryCount > 1 ? <p className="mt-0.5 text-[11px] text-muted">{row.categoryCount} categories scored</p> : null}
            </div>
            <div className="min-w-[68px] text-right">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Score</p>
              {row.score === null ? <p className="mt-1 text-xs font-medium text-muted">Awaiting</p> : <p className="mt-0.5 font-serif text-lg font-bold tabular-nums text-navy sm:text-xl">{row.score.toFixed(2)}</p>}
            </div>
          </article>})}
      </div>}
  </section>;
}

export default function CoordinatorLeaderboardsSection({ pageantId }: Props) {
  const { data: rounds = [], isLoading: roundsLoading } = useRounds(pageantId);
  const { data: categories = [] } = useCategories(pageantId);
  const [roundId, setRoundId] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  useEffect(() => { if (!roundId && rounds.length) setRoundId(rounds[0].id); }, [roundId, rounds]);
  const config = useRoundJudgingConfiguration(pageantId, roundId);
  const entriesQuery = useQuery({
    queryKey: ["coordinator", "pageants", pageantId, "rounds", roundId, "leaderboard"],
    queryFn: () => coordinatorApi.getLeaderboard(pageantId, roundId),
    enabled: !!pageantId && !!roundId,
  });
  const configuredCategoryIds = config.data?.categoryIds ?? [];
  const roundCategories = categories.filter((category) => configuredCategoryIds.includes(category.id) && category.isActive);

  const standings = useMemo(() => {
    const entries = entriesQuery.data ?? [];
    const grouped = new Map<string, CoordinatorLeaderboardEntry[]>();
    entries.filter((entry) => categoryId === "all" || entry.categoryId === categoryId).forEach((entry) => {
      const values = grouped.get(entry.contestantId) ?? [];
      values.push(entry);
      grouped.set(entry.contestantId, values);
    });
    return [...grouped.entries()].map(([id, items]) => {
      const first = items[0];
      const scored = items.filter((item) => item.score !== null);
      const score = scored.length && scored.length === items.length && items.every((item) => item.categoryWeight !== null)
        ? scored.reduce((sum, item) => sum + Number(item.score) * (categoryId === "all" ? Number(item.categoryWeight) / 100 : 1), 0)
        : null;
      return { id, number: first.contestantNumber, name: first.contestantName, photoUrl: first.photoUrl, gender: first.gender?.toLowerCase() === "male" ? "male" : "female", score, categoryCount: scored.length };
    }).sort((a, b) => (b.score ?? -1) - (a.score ?? -1) || a.number - b.number);
  }, [entriesQuery.data, categoryId]);
  const female = standings.filter((item) => item.gender === "female");
  const male = standings.filter((item) => item.gender === "male");

  if (roundsLoading) return <div className="animate-pulse border border-border bg-white p-6"><div className="h-5 w-48 bg-slate" /><div className="mt-5 h-32 bg-slate/60" /></div>;
  if (rounds.length === 0) return <div className="border border-border bg-white p-6"><h2 className="font-serif text-xl font-semibold text-charcoal">No rounds yet</h2><p className="mt-2 text-sm text-muted">Create a round before viewing its leaderboard.</p></div>;

  return <div className="space-y-5">
    <section className="border border-border bg-white p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <label className="min-w-0 flex-1 text-xs font-semibold uppercase tracking-wider text-muted">Round
          <select value={roundId} onChange={(event) => { setRoundId(event.target.value); setCategoryId("all"); }} className="mt-2 block h-11 w-full border border-border bg-white px-3 text-sm font-medium normal-case tracking-normal text-charcoal outline-none focus:border-navy">
            {rounds.map((round) => <option key={round.id} value={round.id}>{round.name} · {round.status.toLowerCase()}</option>)}
          </select>
        </label>
        <label className="min-w-0 flex-1 text-xs font-semibold uppercase tracking-wider text-muted">View
          <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className="mt-2 block h-11 w-full border border-border bg-white px-3 text-sm font-medium normal-case tracking-normal text-charcoal outline-none focus:border-navy">
            <option value="all">Overall round score</option>
            {roundCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </label>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted">All eligible candidates appear, including those without scores. Scored candidates sort by highest score; candidates awaiting scores follow in contestant-number order. Category scores average complete submitted judge sheets, and overall scores use this round’s category weights. Draft sheets are excluded.</p>
    </section>
    {entriesQuery.isError ? <div role="alert" className="border border-red-200 bg-red-50 p-4 text-sm text-red-700">{entriesQuery.error instanceof Error ? entriesQuery.error.message : "Could not load leaderboard scores."}</div> : null}
    {config.isError ? <div role="alert" className="border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Round categories could not be loaded. Try refreshing this section.</div> : null}
    <div className="grid gap-5 lg:grid-cols-2">
      <LeaderboardColumn title="Female" rows={female} loading={entriesQuery.isLoading} />
      <LeaderboardColumn title="Male" rows={male} loading={entriesQuery.isLoading} />
    </div>
  </div>;
}

function CandidatePhoto({ photoUrl, name }: { photoUrl: string | null; name: string }) {
  return <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-gold/50 bg-navy/5 sm:h-14 sm:w-14">
    {photoUrl ? <Image src={photoUrl} alt={`${name} photo`} fill sizes="56px" className="object-cover" /> : <span className="flex h-full w-full items-center justify-center font-serif text-lg font-bold text-navy">{name.charAt(0).toUpperCase()}</span>}
  </div>;
}
