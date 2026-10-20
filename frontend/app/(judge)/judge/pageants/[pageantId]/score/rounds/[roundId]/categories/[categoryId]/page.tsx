"use client";

import { FormEvent, use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AxiosError } from "axios";
import { MdArrowBack, MdCheckCircle, MdClose, MdLock, MdPerson } from "react-icons/md";
import { useJudgePageants } from "@/src/features/judge/hooks/useJudgePageants";
import { judgeApi, type JudgeCategoryScoringWorkspace, type JudgeScoringCandidate } from "@/src/features/judge/api/judge";

type ScoresByCandidate = Record<string, Record<string, string>>;
const genderKey = (gender: string | null) => (gender?.toLowerCase() === "male" ? "male" : "female");
function errorMessage(error: unknown) {
  const axiosError = error as AxiosError<{ message?: string; error?: string }>;
  return axiosError.response?.data?.message ?? axiosError.response?.data?.error ?? axiosError.message ?? "Unable to submit scores. Please try again.";
}

export default function JudgeCategoryScoringPage({ params }: { params: Promise<{ pageantId: string; roundId: string; categoryId: string }> }) {
  const { pageantId, roundId, categoryId } = use(params);
  const pageants = useJudgePageants();
  const pageant = pageants.data?.find((item) => item.id === pageantId);
  const [workspace, setWorkspace] = useState<JudgeCategoryScoringWorkspace | null>(null);
  const [scores, setScores] = useState<ScoresByCandidate>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [savingCandidate, setSavingCandidate] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [finalNotice, setFinalNotice] = useState("");
  const [finalizing, setFinalizing] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError("");
    judgeApi.getCategoryScoring(pageantId, roundId, categoryId).then((data) => {
      if (!active) return;
      setWorkspace(data);
      setScores(Object.fromEntries(data.candidates.map((candidate) => [candidate.id, Object.fromEntries(data.criteria.map((criterion) => {
        const existing = candidate.scores.find((score) => score.roundCriterionId === criterion.roundCriterionId);
        return [criterion.roundCriterionId, existing?.rawScore ?? ""];
      }))])));
    }).catch((error: unknown) => { if (active) setLoadError(errorMessage(error)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [pageantId, roundId, categoryId]);

  const columns = useMemo(() => ({
    male: workspace?.candidates.filter((candidate) => genderKey(candidate.gender) === "male") ?? [],
    female: workspace?.candidates.filter((candidate) => genderKey(candidate.gender) === "female") ?? [],
  }), [workspace]);

  function valueFor(candidate: JudgeScoringCandidate, criterionId: string) {
    return scores[candidate.id]?.[criterionId] ?? candidate.scores.find((score) => score.roundCriterionId === criterionId)?.rawScore ?? "";
  }
  function candidateComplete(candidate: JudgeScoringCandidate) {
    return !!workspace?.criteria.length && workspace.criteria.every((criterion) => {
      const value = valueFor(candidate, criterion.roundCriterionId);
      const number = Number(value);
      return value !== "" && Number.isFinite(number) && number >= Number(criterion.minimumScore) && number <= Number(criterion.maximumScore);
    });
  }
  const categoryComplete = !!workspace?.candidates.length && workspace.candidates.every(candidateComplete);
  const categorySubmitted = !!workspace?.candidates.length && workspace.candidates.every((candidate) => candidate.submissionStatus === "SUBMITTED" || candidate.submissionStatus === "LOCKED");

  async function submit(event: FormEvent<HTMLFormElement>, candidate: JudgeScoringCandidate) {
    event.preventDefault();
    if (!workspace) return;
    setSavingCandidate(candidate.id);
    setSubmitError("");
    setSavedNotice("");
    try {
      const candidateScores = scores[candidate.id] ?? {};
      const entered = workspace.criteria.filter((criterion) => candidateScores[criterion.roundCriterionId] != null && candidateScores[criterion.roundCriterionId] !== "");
      const invalid = entered.find((criterion) => {
        const score = Number(candidateScores[criterion.roundCriterionId]);
        return !Number.isFinite(score) || score < Number(criterion.minimumScore) || score > Number(criterion.maximumScore);
      });
      if (invalid) { setSubmitError(`${invalid.name} must be between ${invalid.minimumScore} and ${invalid.maximumScore}.`); return; }
      await judgeApi.saveCategoryScoreDraft(pageantId, roundId, categoryId, candidate.id, entered.map((criterion) => ({ roundCriterionId: criterion.roundCriterionId, rawScore: candidateScores[criterion.roundCriterionId] })));
      setWorkspace((current) => current ? { ...current, candidates: current.candidates.map((item) => item.id === candidate.id ? { ...item, scores: [...item.scores.filter((score) => !entered.some((criterion) => criterion.roundCriterionId === score.roundCriterionId)), ...entered.map((criterion) => ({ roundCriterionId: criterion.roundCriterionId, rawScore: candidateScores[criterion.roundCriterionId] }))] } : item) } : current);
      setSavedNotice(`Draft saved for contestant #${candidate.contestantNumber}.`);
    } catch (error) {
      setSubmitError(errorMessage(error));
    } finally {
      setSavingCandidate(null);
    }
  }

  async function submitNow() {
    if (!workspace || !categoryComplete || categorySubmitted) return;
    setFinalizing(true); setSubmitError(""); setFinalNotice("");
    try {
      for (const candidate of workspace.candidates) {
        await judgeApi.saveCategoryScoreDraft(pageantId, roundId, categoryId, candidate.id, workspace.criteria.map((criterion) => ({ roundCriterionId: criterion.roundCriterionId, rawScore: valueFor(candidate, criterion.roundCriterionId) })));
      }
      const result = await judgeApi.submitCategoryScores(pageantId, roundId, categoryId);
      setWorkspace((current) => current ? { ...current, candidates: current.candidates.map((candidate) => ({ ...candidate, submissionStatus: "SUBMITTED" })) } : current);
      setFinalNotice(`Final scores submitted for ${result.candidateCount} candidates. This category is now locked.`);
    } catch (error) { setSubmitError(errorMessage(error)); }
    finally { setFinalizing(false); }
  }

  function candidateCard(candidate: JudgeScoringCandidate) {
    const submitted = candidate.submissionStatus === "SUBMITTED" || candidate.submissionStatus === "LOCKED";
    return <form key={candidate.id} onSubmit={(event) => void submit(event, candidate)} className="overflow-hidden border border-border bg-white shadow-sm">
      <div className="flex gap-4 border-b border-border bg-gradient-to-r from-white to-slate-50 p-4 sm:p-5">
        {candidate.photoUrl ? <img src={candidate.photoUrl} alt={candidate.displayName} className="h-24 w-20 shrink-0 rounded-sm bg-slate-100 object-cover sm:h-28 sm:w-24" /> : <div className="flex h-24 w-20 shrink-0 items-center justify-center rounded-sm bg-navy/5 text-3xl text-navy/30 sm:h-28 sm:w-24"><MdPerson /></div>}
        <div className="min-w-0 flex-1 self-center"><span className="inline-flex border border-gold/40 bg-gold/10 px-2.5 py-1 font-serif text-sm font-bold text-[#87691e]">#{candidate.contestantNumber}</span><h3 className="mt-2 break-words font-serif text-lg font-bold leading-tight text-charcoal sm:text-xl">{candidate.displayName}</h3><p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">{candidate.gender || "Female division"}</p></div>
        {submitted ? <span className="inline-flex h-fit items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-800"><MdCheckCircle /> Submitted</span> : null}
      </div>
      {candidate.biography ? <p className="border-b border-border px-4 py-3 text-xs leading-5 text-muted sm:px-5">{candidate.biography}</p> : null}
      <div className="space-y-3 p-4 sm:p-5">
        {workspace?.criteria.map((criterion) => <label key={criterion.roundCriterionId} className="grid grid-cols-[1fr_88px] items-center gap-3"><span className="min-w-0"><span className="block break-words text-sm font-semibold text-charcoal">{criterion.name}</span><span className="mt-0.5 block text-[10px] text-muted">{criterion.minimumScore}–{criterion.maximumScore} points · {criterion.weightPercentage}% weight</span></span><input type="number" min={criterion.minimumScore} max={criterion.maximumScore} step="any" disabled={submitted || savingCandidate === candidate.id} value={scores[candidate.id]?.[criterion.roundCriterionId] ?? ""} onChange={(event) => setScores((current) => ({ ...current, [candidate.id]: { ...current[candidate.id], [criterion.roundCriterionId]: event.target.value } }))} aria-label={`${criterion.name} score for ${candidate.displayName}`} className="w-full border border-border bg-white px-2 py-2 text-right text-sm font-semibold text-charcoal outline-none transition focus:border-navy disabled:bg-slate-50" /></label>)}
        <div className="flex items-center justify-between gap-3 border-t border-border pt-3"><span className="text-[10px] leading-4 text-muted">Save this draft to review before final submission.</span><button type="submit" disabled={submitted || savingCandidate === candidate.id || !workspace?.criteria.length} className="inline-flex shrink-0 items-center gap-2 bg-navy px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-navy/90 disabled:cursor-not-allowed disabled:bg-slate-300">{savingCandidate === candidate.id ? "Saving…" : submitted ? <><MdLock /> Submitted</> : "Save draft"}</button></div>
      </div>
    </form>;
  }

  return <main className="min-h-screen bg-slate-50 pb-14">
    <header className="border-b border-gold/25 bg-navy text-white"><div className="container-page flex min-h-24 flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0"><Link href={`/judge/pageants/${pageantId}/score`} className="inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-gold"><MdArrowBack /> Back to all rounds</Link><h1 className="mt-2 truncate font-serif text-xl font-bold sm:text-2xl">{workspace?.roundName ?? (loading ? "Loading round…" : "Round scoring")}</h1></div>
      <div className="flex items-center gap-3 sm:max-w-[45%] sm:justify-end">{pageant?.logoUrl ? <img src={pageant.logoUrl} alt="" className="h-10 w-10 rounded-full border border-white/20 bg-white object-cover" /> : <span className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/40 bg-white/10 font-serif text-lg font-bold text-gold">{pageant?.name?.slice(0, 1) ?? "V"}</span>}<div className="min-w-0"><p className="truncate text-sm font-semibold">{pageant?.name ?? "Pageant"}</p><p className="truncate text-[11px] text-white/55">{workspace?.categoryName ?? "Category scoring"}</p></div></div>
    </div></header>
    <section className="container-page py-6 sm:py-8">
      {loading ? <div className="grid gap-5 lg:grid-cols-2"><div className="h-40 animate-pulse bg-white"/><div className="h-40 animate-pulse bg-white"/></div> : null}
      {loadError ? <div className="border border-error/25 bg-white p-6 text-sm text-error">Unable to load scoring details: {loadError}</div> : null}
      {workspace && !loading ? <>
        <div className="mb-6 border border-gold/30 bg-white p-5 shadow-sm sm:p-6"><Link href={`/judge/pageants/${pageantId}/score/rounds/${roundId}`} className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-navy hover:text-gold"><MdArrowBack /> Back to this round’s categories</Link><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gold">Category scoring</p><div className="mt-1 flex flex-wrap items-end justify-between gap-3"><div><h2 className="font-serif text-2xl font-bold text-charcoal sm:text-3xl">{workspace.categoryName}</h2><p className="mt-1 text-sm text-muted">Save drafts while scoring. Final submission locks this category.</p></div><span className="border border-border bg-slate-50 px-3 py-2 text-xs font-semibold text-muted">{workspace.criteria.length} criteria</span></div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4"><div><p className="text-xs font-semibold text-charcoal">{workspace.candidates.filter(candidateComplete).length} of {workspace.candidates.length} candidates complete</p>{!categoryComplete && !categorySubmitted ? <p className="mt-1 text-[10px] font-semibold text-error">Enter valid scores for every criterion and candidate before submitting.</p> : null}</div><div className="flex gap-2"><button type="button" onClick={() => setReviewOpen(true)} className="border border-navy/30 px-3 py-2 text-xs font-bold text-navy hover:border-gold">Review scores</button><button type="button" onClick={() => void submitNow()} disabled={!categoryComplete || categorySubmitted || finalizing} title={!categoryComplete ? "Complete every candidate score first" : undefined} className="bg-navy px-3 py-2 text-xs font-bold text-white hover:bg-navy/90 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600">{finalizing ? "Submitting…" : categorySubmitted ? "Submitted" : "Submit now"}</button></div></div>
          {reviewOpen ? <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-navy/65 p-3 backdrop-blur-sm sm:p-6" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setReviewOpen(false); }}><section role="dialog" aria-modal="true" aria-labelledby="category-score-review-title" className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-sm border border-gold/50 bg-white shadow-2xl"><header className="sticky top-0 z-10 flex shrink-0 items-center justify-between gap-3 border-b border-gold/40 bg-navy px-4 py-4 text-white sm:px-6"><div><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gold">Score review</p><h2 id="category-score-review-title" className="font-serif text-lg font-bold sm:text-xl">{workspace.categoryName}</h2><p className="mt-1 text-xs text-white/70">{workspace.candidates.filter(candidateComplete).length} of {workspace.candidates.length} candidates complete</p></div><button type="button" onClick={() => setReviewOpen(false)} aria-label="Close score review" className="flex h-9 w-9 shrink-0 items-center justify-center border border-white/25 text-white transition hover:border-gold hover:text-gold"><MdClose className="text-xl" /></button></header><div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain p-3 sm:p-5">{workspace.candidates.map((candidate) => { const submitted = candidate.submissionStatus === "SUBMITTED" || candidate.submissionStatus === "LOCKED"; return <form key={candidate.id} onSubmit={(event) => void submit(event, candidate)} className="border border-border bg-slate-50 p-3 sm:p-4"><div className="mb-3 flex justify-between gap-2 text-sm"><span className="font-semibold text-charcoal">#{candidate.contestantNumber} · {candidate.displayName}</span><span className={`text-[10px] font-bold uppercase ${submitted ? "text-emerald-700" : candidateComplete(candidate) ? "text-navy" : "text-error"}`}>{submitted ? "Submitted" : candidateComplete(candidate) ? "Ready" : "Incomplete"}</span></div><div className="grid gap-x-4 sm:grid-cols-2">{workspace.criteria.map((criterion) => <label key={criterion.roundCriterionId} className="grid min-w-0 grid-cols-[minmax(0,1fr)_88px] items-center gap-2 border-b border-border/70 py-1.5"><span className="truncate text-xs font-medium text-charcoal">{criterion.name}</span><input type="number" min={criterion.minimumScore} max={criterion.maximumScore} step="any" disabled={submitted || savingCandidate === candidate.id} value={valueFor(candidate, criterion.roundCriterionId)} onChange={(event) => setScores((current) => ({ ...current, [candidate.id]: { ...current[candidate.id], [criterion.roundCriterionId]: event.target.value } }))} aria-label={`${criterion.name} score for ${candidate.displayName}`} className="w-full border border-navy/25 bg-white px-2 py-2 text-center text-sm font-bold text-navy outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 disabled:bg-slate-100" /></label>)}</div><div className="mt-3 flex justify-end"><button type="submit" disabled={submitted || savingCandidate === candidate.id || !workspace.criteria.length} className="bg-navy px-3 py-2 text-xs font-bold text-white hover:bg-navy/90 disabled:cursor-not-allowed disabled:bg-slate-300">{savingCandidate === candidate.id ? "Saving…" : submitted ? "Submitted" : "Save draft"}</button></div></form>; })}</div></section></div> : null}
          {submitError ? <p role="alert" className="mt-4 border border-error/20 bg-error/5 px-3 py-2.5 text-sm text-error">{submitError}</p> : null}{savedNotice ? <p role="status" className="mt-4 inline-flex items-center gap-2 border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800"><MdCheckCircle />{savedNotice}</p> : null}{finalNotice ? <p role="status" className="mt-4 inline-flex items-center gap-2 border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800"><MdCheckCircle />{finalNotice}</p> : null}
        </div>
        {!workspace.criteria.length ? <div className="border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">This category does not have any active criteria available for scoring.</div> : null}
        {workspace.criteria.length > 0 ? <div className="grid items-start gap-6 xl:grid-cols-2">
          <section><div className="mb-3 flex items-center justify-between border-b-2 border-navy pb-2"><h3 className="font-serif text-xl font-bold text-navy">Male</h3><span className="text-xs text-muted">{columns.male.length} contestants</span></div><div className="space-y-4">{columns.male.length ? columns.male.map(candidateCard) : <p className="border border-dashed border-border bg-white p-5 text-sm text-muted">No male contestants in this category.</p>}</div></section>
          <section><div className="mb-3 flex items-center justify-between border-b-2 border-gold pb-2"><h3 className="font-serif text-xl font-bold text-[#87691e]">Female</h3><span className="text-xs text-muted">{columns.female.length} contestants</span></div><div className="space-y-4">{columns.female.length ? columns.female.map(candidateCard) : <p className="border border-dashed border-border bg-white p-5 text-sm text-muted">No female contestants in this category.</p>}</div></section>
        </div> : null}
      </> : null}
    </section>
  </main>;
}
