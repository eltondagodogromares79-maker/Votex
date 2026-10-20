"use client";

import { FormEvent, use, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useQueries } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { MdArrowBack, MdCheckCircle, MdClose, MdLock, MdSearch } from "react-icons/md";
import { judgeApi, type JudgeCategoryScoringWorkspace, type JudgeScoringCandidate } from "@/src/features/judge/api/judge";
import { useJudgeCategories, useJudgeContestants, useJudgePageants, useJudgeRounds } from "@/src/features/judge/hooks/useJudgePageants";

const isEligible = (gender: string | null, scope: string) => {
  const isMale = gender?.toLowerCase() === "male";
  return scope === "OPEN" || scope === "CUSTOM" || (scope === "MEN" && isMale) || ((scope === "WOMEN" || scope === "LGBTQ_PLUS") && !isMale);
};
const scoreKey = (categoryId: string, candidateId: string) => `${categoryId}:${candidateId}`;
function messageFrom(error: unknown) {
  const axiosError = error as AxiosError<{ message?: string; error?: string }>;
  return axiosError.response?.data?.message ?? axiosError.response?.data?.error ?? axiosError.message ?? "Unable to submit these scores.";
}

export default function JudgeRoundPage({ params }: { params: Promise<{ pageantId: string; roundId: string }> }) {
  const { pageantId, roundId } = use(params);
  const [maleCategoryFilter, setMaleCategoryFilter] = useState("");
  const [femaleCategoryFilter, setFemaleCategoryFilter] = useState("");
  const [maleSearch, setMaleSearch] = useState("");
  const [femaleSearch, setFemaleSearch] = useState("");
  const [reviewingScores, setReviewingScores] = useState(false);
  const [scoreInputs, setScoreInputs] = useState<Record<string, Record<string, string>>>({});
  const [submittingKey, setSubmittingKey] = useState<string | null>(null);
  const [finalizingScores, setFinalizingScores] = useState(false);
  const [submittedKeys, setSubmittedKeys] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notices, setNotices] = useState<Record<string, string>>({});
  const [finalizeError, setFinalizeError] = useState("");
  const [finalizeNotice, setFinalizeNotice] = useState("");
  const pageants = useJudgePageants();
  const pageant = pageants.data?.find((item) => item.id === pageantId);
  const canLoadPageantData = !!pageant && ["PUBLISHED", "ONGOING", "COMPLETED"].includes(pageant.status.toUpperCase());
  // Refresh status while this scoring page is open so a coordinator's close
  // action removes the scoring controls promptly.
  const roundsQuery = useJudgeRounds(pageantId, canLoadPageantData, 5_000);
  const categoriesQuery = useJudgeCategories(pageantId, canLoadPageantData, 5_000);
  const contestantsQuery = useJudgeContestants(pageantId, canLoadPageantData);
  const round = roundsQuery.data?.find((item) => item.id === roundId);
  const categories = (categoriesQuery.data ?? []).filter((item) => item.roundId === roundId);
  const workspacesQuery = useQueries({
    queries: categories.map((category) => ({
      queryKey: ["judge", "pageants", pageantId, "rounds", roundId, "categories", category.id, "scoring"],
      queryFn: () => judgeApi.getCategoryScoring(pageantId, roundId, category.id),
      enabled: canLoadPageantData && !!round && round.status === "OPEN" && category.status === "OPEN" && categories.some((item) => item.id === category.id && item.isActive),
    })),
  });
  const openCategoryIds = new Set(categories.filter((category) => category.status === "OPEN" && category.isActive).map((category) => category.id));
  const workspaces = workspacesQuery.map((query) => query.data).filter((workspace): workspace is JudgeCategoryScoringWorkspace => !!workspace && openCategoryIds.has(workspace.categoryId));
  const workspacesByCategory = useMemo(() => new Map(workspaces.map((workspace) => [workspace.categoryId, workspace])), [workspaces]);
  const maleCategories = categories.filter((category) => ["OPEN", "CUSTOM", "MEN"].includes(category.eligibilityScope));
  const femaleCategories = categories.filter((category) => ["OPEN", "CUSTOM", "WOMEN", "LGBTQ_PLUS"].includes(category.eligibilityScope));
  const selectedMaleCategory = maleCategories.find((item) => item.id === maleCategoryFilter && item.status === "OPEN") ?? maleCategories.find((item) => item.status === "OPEN") ?? maleCategories[0];
  const selectedFemaleCategory = femaleCategories.find((item) => item.id === femaleCategoryFilter && item.status === "OPEN") ?? femaleCategories.find((item) => item.status === "OPEN") ?? femaleCategories[0];
  const selectedMaleWorkspace = selectedMaleCategory ? workspacesByCategory.get(selectedMaleCategory.id) : undefined;
  const selectedFemaleWorkspace = selectedFemaleCategory ? workspacesByCategory.get(selectedFemaleCategory.id) : undefined;
  const selectedScoringWorkspaces = Array.from(new Map([selectedFemaleWorkspace, selectedMaleWorkspace].filter((workspace): workspace is JudgeCategoryScoringWorkspace => !!workspace).map((workspace) => [workspace.categoryId, workspace])).values());
  const allContestants = contestantsQuery.data ?? [];
  const matchesSearch = (candidate: (typeof allContestants)[number], value: string) => `${candidate.displayName} ${candidate.contestantNumber} ${candidate.firstName} ${candidate.middleName ?? ""} ${candidate.lastName}`.toLowerCase().includes(value.trim().toLowerCase());
  const maleContestants = allContestants.filter((candidate) => candidate.gender?.toLowerCase() === "male" && (!selectedMaleCategory || isEligible(candidate.gender, selectedMaleCategory.eligibilityScope)) && matchesSearch(candidate, maleSearch));
  const femaleContestants = allContestants.filter((candidate) => candidate.gender?.toLowerCase() !== "male" && (!selectedFemaleCategory || isEligible(candidate.gender, selectedFemaleCategory.eligibilityScope)) && matchesSearch(candidate, femaleSearch));
  const loading = pageants.isLoading || (canLoadPageantData && (roundsQuery.isLoading || categoriesQuery.isLoading || contestantsQuery.isLoading));
  const unavailable = !loading && (!pageant || !round || round.status !== "OPEN");
  const scoringLoading = workspacesQuery.some((query) => query.isLoading);
  const scoringError = workspacesQuery.some((query) => query.isError);

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    setMaleCategoryFilter(search.get("maleCategory") ?? "");
    setFemaleCategoryFilter(search.get("femaleCategory") ?? "");
  }, [pageantId, roundId]);

  function selectGenderCategory(gender: "male" | "female", category: (typeof categories)[number]) {
    if (category.status !== "OPEN") return;
    const url = new URL(window.location.href);
    if (gender === "male") {
      setMaleCategoryFilter(category.id);
      url.searchParams.set("maleCategory", category.id);
      if (category.eligibilityScope === "OPEN") {
        setFemaleCategoryFilter(category.id);
        url.searchParams.set("femaleCategory", category.id);
      }
    } else {
      setFemaleCategoryFilter(category.id);
      url.searchParams.set("femaleCategory", category.id);
      if (category.eligibilityScope === "OPEN") {
        setMaleCategoryFilter(category.id);
        url.searchParams.set("maleCategory", category.id);
      }
    }
    window.history.replaceState(window.history.state, "", url.toString());
  }

  function valueFor(workspace: JudgeCategoryScoringWorkspace, candidate: JudgeScoringCandidate, criterionId: string) {
    const key = scoreKey(workspace.categoryId, candidate.id);
    return scoreInputs[key]?.[criterionId] ?? candidate.scores.find((score) => score.roundCriterionId === criterionId)?.rawScore ?? "";
  }

  function candidateIsComplete(workspace: JudgeCategoryScoringWorkspace, candidate: JudgeScoringCandidate) {
    if (!workspace.criteria.length) return false;
    return workspace.criteria.every((criterion) => {
      const value = valueFor(workspace, candidate, criterion.roundCriterionId);
      if (value === "") return false;
      const numericValue = Number(value);
      return Number.isFinite(numericValue) && numericValue >= Number(criterion.minimumScore) && numericValue <= Number(criterion.maximumScore);
    });
  }

  function workspaceIsComplete(workspace?: JudgeCategoryScoringWorkspace) {
    return !!workspace && workspace.candidates.length > 0 && workspace.candidates.every((candidate) => candidateIsComplete(workspace, candidate));
  }

  function workspaceWasSubmitted(workspace?: JudgeCategoryScoringWorkspace) {
    return !!workspace && workspace.candidates.length > 0 && workspace.candidates.every((candidate) =>
      submittedKeys.has(scoreKey(workspace.categoryId, candidate.id)) || candidate.submissionStatus === "SUBMITTED" || candidate.submissionStatus === "LOCKED",
    );
  }

  function reviewPanel(workspacesToReview: JudgeCategoryScoringWorkspace[], open: boolean, onClose: () => void) {
    if (!open || !workspacesToReview.length) return null;
    const femaleEntries = workspacesToReview.flatMap((workspace) => workspace.candidates.filter((candidate) => candidate.gender?.toLowerCase() !== "male").map((candidate) => ({ workspace, candidate })));
    const maleEntries = workspacesToReview.flatMap((workspace) => workspace.candidates.filter((candidate) => candidate.gender?.toLowerCase() === "male").map((candidate) => ({ workspace, candidate })));
    const showFemale = workspacesToReview.some((workspace) => !["MEN"].includes(workspace.eligibilityScope));
    const showMale = workspacesToReview.some((workspace) => !["WOMEN", "LGBTQ_PLUS"].includes(workspace.eligibilityScope));
    const totalCandidates = femaleEntries.length + maleEntries.length;
    const completeCount = [...femaleEntries, ...maleEntries].filter(({ workspace, candidate }) => candidateIsComplete(workspace, candidate)).length;
    const renderDivision = (division: "female" | "male", entries: typeof femaleEntries) => <section key={division} className="min-w-0">
      <div className={`mb-3 flex items-center justify-between border-b-2 pb-2 ${division === "female" ? "border-gold" : "border-navy"}`}><h3 className={`font-serif text-lg font-bold ${division === "female" ? "text-[#87691e]" : "text-navy"}`}>{division === "female" ? "Female" : "Male"}</h3><span className="text-xs text-muted">{entries.length} candidates</span></div>
      <div className="space-y-3">{entries.length ? entries.map(({ workspace, candidate }) => {
        const key = scoreKey(workspace.categoryId, candidate.id);
        const submitted = submittedKeys.has(key) || candidate.submissionStatus === "SUBMITTED" || candidate.submissionStatus === "LOCKED";
        const total = workspace.criteria.reduce((sum, criterion) => {
          const value = valueFor(workspace, candidate, criterion.roundCriterionId);
          if (value === "") return sum;
          const raw = Number(value); const min = Number(criterion.minimumScore); const max = Number(criterion.maximumScore); const weight = Number(criterion.weightPercentage);
          if (!Number.isFinite(raw) || raw < min || raw > max || !Number.isFinite(weight)) return sum;
          const normalized = max === min ? 100 : ((raw - min) / (max - min)) * 100;
          return sum + normalized * weight / 100;
        }, 0);
        return <form key={`${workspace.categoryId}:${candidate.id}`} onSubmit={(event) => void saveDraft(event, workspace, candidate)} className="border border-border bg-surface p-3 sm:p-4">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-2"><div><span className="inline-flex bg-navy px-2 py-1 font-serif text-sm font-bold text-gold">#{candidate.contestantNumber}</span><h4 className="mt-2 break-words text-sm font-bold text-charcoal">{candidate.displayName}</h4><p className="mt-1 text-[10px] text-muted">{workspace.categoryName}</p></div><span className={`text-[10px] font-bold uppercase ${submitted ? "text-emerald-700" : candidateIsComplete(workspace, candidate) ? "text-navy" : "text-error"}`}>{submitted ? "Submitted" : candidateIsComplete(workspace, candidate) ? "Ready" : "Incomplete"}</span></div>
          <div className="space-y-2">{workspace.criteria.map((criterion) => <label key={criterion.roundCriterionId} className="grid min-w-0 grid-cols-[minmax(0,1fr)_92px] items-center gap-2"><span className="truncate text-xs font-medium text-charcoal">{criterion.name} <span className="text-[10px] text-muted">({criterion.minimumScore}–{criterion.maximumScore})</span></span><input type="number" min={criterion.minimumScore} max={criterion.maximumScore} step="any" disabled={submitted || submittingKey === key} value={valueFor(workspace, candidate, criterion.roundCriterionId)} onChange={(event) => setScoreInputs((items) => ({ ...items, [key]: { ...items[key], [criterion.roundCriterionId]: event.target.value } }))} aria-label={`${criterion.name} score for ${candidate.displayName}`} className="w-full border border-navy/25 bg-white px-2 py-2 text-center text-sm font-bold text-navy outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 disabled:bg-slate-100" /></label>)}</div>
          <div className="mt-3 flex items-center justify-between border-t border-border pt-2"><span className="text-xs font-semibold text-muted">Total score</span><span className="font-serif text-lg font-bold text-navy">{total.toFixed(2)}</span></div>
          {errors[key] ? <p role="alert" className="mt-2 border border-error/20 bg-error/5 px-2 py-1.5 text-xs text-error">{errors[key]}</p> : null}
          {notices[key] ? <p role="status" className="mt-2 text-xs text-emerald-800">{notices[key]}</p> : null}
          <button type="submit" disabled={submitted || submittingKey === key || !workspace.criteria.length} className="mt-3 w-full bg-navy px-3 py-2 text-xs font-bold text-white hover:bg-navy/90 disabled:cursor-not-allowed disabled:bg-slate-300">{submittingKey === key ? "Saving…" : submitted ? "Submitted" : "Save draft"}</button>
        </form>;
      }) : <p className="border border-dashed border-border p-5 text-center text-sm text-muted">No {division} candidates in this category.</p>}</div>
    </section>;
    return <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-navy/65 p-3 backdrop-blur-sm sm:p-6" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="score-review-title" className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-sm border border-gold/50 bg-white shadow-2xl">
        <header className="sticky top-0 z-10 flex shrink-0 items-center justify-between gap-3 border-b border-gold/40 bg-navy px-4 py-4 text-white sm:px-6"><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gold">Category · score review</p><h2 id="score-review-title" className="truncate font-serif text-lg font-bold sm:text-xl">{workspacesToReview.map((workspace) => workspace.categoryName).join(" · ")}</h2><p className="mt-1 text-xs text-white/70">{completeCount} of {totalCandidates} candidates complete · scores are weighted totals</p></div><button type="button" onClick={onClose} aria-label="Close score review" className="flex h-9 w-9 shrink-0 items-center justify-center border border-white/25 text-white transition hover:border-gold hover:text-gold"><MdClose className="text-xl" /></button></header>
        <div className={`min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 sm:p-5 ${showFemale && showMale ? "grid items-start gap-5 md:grid-cols-2" : "space-y-5"}`}>{showFemale ? renderDivision("female", femaleEntries) : null}{showMale ? renderDivision("male", maleEntries) : null}</div>
      </section>
    </div>;
  }

  async function saveDraft(event: FormEvent<HTMLFormElement>, workspace: JudgeCategoryScoringWorkspace, candidate: JudgeScoringCandidate) {
    event.preventDefault();
    const key = scoreKey(workspace.categoryId, candidate.id);
    const category = categories.find((item) => item.id === workspace.categoryId);
    if (round?.status !== "OPEN" || !category?.isActive) {
      setErrors((items) => ({ ...items, [key]: "Scoring is closed for this category. Drafts can no longer be changed." }));
      return;
    }
    const candidateScores = scoreInputs[key] ?? {};
    const enteredScores = workspace.criteria.filter((criterion) => candidateScores[criterion.roundCriterionId] != null && candidateScores[criterion.roundCriterionId] !== "");
    if (!enteredScores.length) {
      setErrors((items) => ({ ...items, [key]: "Enter at least one score before saving this draft." }));
      return;
    }
    const invalidScore = enteredScores.find((criterion) => {
      const value = Number(candidateScores[criterion.roundCriterionId]);
      return !Number.isFinite(value) || value < Number(criterion.minimumScore) || value > Number(criterion.maximumScore);
    });
    if (invalidScore) {
      setErrors((items) => ({ ...items, [key]: `${invalidScore.name} must be between ${invalidScore.minimumScore} and ${invalidScore.maximumScore}.` }));
      return;
    }
    setSubmittingKey(key);
    setErrors((items) => ({ ...items, [key]: "" }));
    setNotices((items) => ({ ...items, [key]: "" }));
    try {
      await judgeApi.saveCategoryScoreDraft(pageantId, roundId, workspace.categoryId, candidate.id, enteredScores.map((criterion) => ({ roundCriterionId: criterion.roundCriterionId, rawScore: candidateScores[criterion.roundCriterionId] })));
      setNotices((items) => ({ ...items, [key]: "Draft saved. You can review or edit it before final submission." }));
    } catch (error) {
      setErrors((items) => ({ ...items, [key]: messageFrom(error) }));
    } finally {
      setSubmittingKey(null);
    }
  }

  async function submitSelectedCategories() {
    if (round?.status !== "OPEN" || selectedScoringWorkspaces.some((workspace) => !categories.find((item) => item.id === workspace.categoryId)?.isActive)) {
      setFinalizeError("Scoring is closed for one or more selected categories. Scores can no longer be submitted.");
      return;
    }
    if (!selectedScoringWorkspaces.length || selectedScoringWorkspaces.some((workspace) => !workspaceIsComplete(workspace))) {
      setFinalizeError("Complete every criterion for every candidate in the selected categories before submitting.");
      return;
    }
    setFinalizingScores(true);
    setFinalizeError("");
    setFinalizeNotice("");
    try {
      let totalSubmitted = 0;
      for (const workspace of selectedScoringWorkspaces) {
        if (workspaceWasSubmitted(workspace)) continue;
        for (const candidate of workspace.candidates) {
          const values = workspace.criteria.map((criterion) => ({ roundCriterionId: criterion.roundCriterionId, rawScore: valueFor(workspace, candidate, criterion.roundCriterionId) }));
          await judgeApi.saveCategoryScoreDraft(pageantId, roundId, workspace.categoryId, candidate.id, values);
        }
        const result = await judgeApi.submitCategoryScores(pageantId, roundId, workspace.categoryId);
        totalSubmitted += result.candidateCount;
        setSubmittedKeys((items) => new Set([...items, ...workspace.candidates.map((candidate) => scoreKey(workspace.categoryId, candidate.id))]));
      }
      setFinalizeNotice(`Submitted final scores for ${totalSubmitted} candidates.`);
    } catch (error) {
      setFinalizeError(messageFrom(error));
    } finally {
      setFinalizingScores(false);
    }
  }

  function candidateCard(candidate: (typeof allContestants)[number], gender: "male" | "female") {
    const candidateCategory = gender === "male" ? selectedMaleCategory : selectedFemaleCategory;
    return <article key={candidate.id} className="w-full shrink-0 snap-start overflow-hidden rounded-sm border border-border bg-surface shadow-md shadow-navy/10">
      <div className="space-y-4 p-4 sm:p-5">
        <div className="flex min-h-44 items-stretch gap-4 border-b border-border pb-4 sm:min-h-52">
          <div className="relative min-h-44 w-[42%] shrink-0 overflow-hidden border border-gold/35 bg-navy/10 sm:min-h-52">{candidate.photoUrl ? <img src={candidate.photoUrl} alt={candidate.displayName} className="absolute inset-0 h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center bg-navy font-serif text-5xl font-bold text-gold">{candidate.contestantNumber}</div>}</div>
          <div className="min-w-0 flex-1 self-center"><span className="inline-flex bg-navy px-3 py-1.5 font-serif text-lg font-bold text-gold">#{candidate.contestantNumber}</span><h3 className="mt-3 break-words font-serif text-xl font-bold leading-tight text-charcoal sm:text-2xl">{candidate.displayName}</h3><p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-navy">{gender} contestant</p>{candidate.biography ? <p className="mt-3 line-clamp-4 text-xs leading-5 text-muted">{candidate.biography}</p> : null}</div>
        </div>
        {candidateCategory && isEligible(candidate.gender, candidateCategory.eligibilityScope) ? (() => {
          const category = candidateCategory;
          const workspace = workspacesByCategory.get(category.id);
          const scoreCandidate = workspace?.candidates.find((item) => item.id === candidate.id);
          const key = scoreKey(category.id, candidate.id);
          const submitted = submittedKeys.has(key) || scoreCandidate?.submissionStatus === "SUBMITTED" || scoreCandidate?.submissionStatus === "LOCKED";
          if (category.status !== "OPEN") return <div key={category.id} className="border border-amber-200 bg-amber-50 p-3"><h4 className="font-serif text-lg font-bold text-navy">{category.name}</h4><p className="mt-2 text-xs font-semibold text-amber-900">{category.status === "DRAFT" ? "This category is not open yet." : category.status === "CLOSED" ? "This category is closed." : "This category is completed."} Scores cannot be entered.</p></div>;
          if (!workspace) return <div key={category.id} className="border border-border bg-slate/50 p-3"><h4 className="font-serif text-lg font-bold text-navy">{category.name}</h4><p className="mt-2 text-xs text-muted">{scoringLoading ? "Loading criteria…" : "Could not load this category’s criteria."}</p></div>;
          return <form key={category.id} onSubmit={(event) => void saveDraft(event, workspace, scoreCandidate ?? { id: candidate.id, contestantNumber: candidate.contestantNumber, displayName: candidate.displayName, gender: candidate.gender, photoUrl: candidate.photoUrl, biography: candidate.biography, submissionStatus: null, scores: [] })} className="overflow-hidden border border-border bg-surface">
            <div className="border-l-4 border-gold bg-slate/60 px-3 py-3"><p className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted">Category</p><h4 className="mt-0.5 break-words font-serif text-lg font-bold text-navy">{category.name}</h4></div>
            <div className="space-y-3 bg-surface p-3">
              {workspace.criteria.map((criterion) => <label key={criterion.roundCriterionId} className="grid min-w-0 grid-cols-[minmax(0,1fr)_112px] items-center gap-3 border-b border-border pb-3 last:border-0 last:pb-0"><span className="min-w-0"><span className="block break-words text-sm font-semibold text-charcoal">{criterion.name}</span><span className="mt-1 block text-xs font-bold text-navy">Score {criterion.minimumScore}–{criterion.maximumScore}</span><span className="mt-0.5 block text-[10px] text-muted">Weight {criterion.weightPercentage}%</span></span><span className="min-w-0"><span className="mb-1 block text-[9px] font-bold uppercase tracking-[0.12em] text-navy">Points</span><input type="number" min={criterion.minimumScore} max={criterion.maximumScore} step="any" placeholder={`${criterion.minimumScore}–${criterion.maximumScore}`} disabled={submitted || submittingKey === key} value={scoreInputs[key]?.[criterion.roundCriterionId] ?? scoreCandidate?.scores.find((saved) => saved.roundCriterionId === criterion.roundCriterionId)?.rawScore ?? ""} onChange={(event) => setScoreInputs((items) => ({ ...items, [key]: { ...items[key], [criterion.roundCriterionId]: event.target.value } }))} aria-label={`${criterion.name} score for ${candidate.displayName}`} className="w-full min-w-0 border border-border bg-slate px-2 py-2.5 text-center text-base font-bold text-navy outline-none placeholder:text-muted/70 focus:border-gold disabled:bg-slate/80" /></span>
              </label>)}
              {errors[key] ? <p role="alert" className="border border-error/20 bg-error/5 px-2.5 py-2 text-xs text-error">{errors[key]}</p> : null}
              {notices[key] ? <p role="status" className="inline-flex items-center gap-1.5 text-xs text-emerald-800"><MdCheckCircle />{notices[key]}</p> : null}
              <button type="submit" disabled={submitted || submittingKey === key || !workspace.criteria.length} className="inline-flex w-full items-center justify-center gap-2 bg-navy px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-navy/90 disabled:cursor-not-allowed disabled:bg-slate/70 disabled:text-muted">{submittingKey === key ? "Saving…" : submitted ? <><MdLock /> Scores submitted</> : "Save draft"}</button>
            </div>
          </form>;
        })() : <p className="border border-dashed border-border bg-slate-50 p-4 text-sm text-muted">No category is available for this contestant.</p>}
      </div>
    </article>;
  }

  return <main className="min-h-full bg-slate-50 pb-12">
    <header className="border-b border-gold/30 bg-navy text-white shadow-md shadow-navy/10"><div className="container-page flex h-20 items-center justify-between gap-3 sm:h-24 sm:gap-6">
      <div className="min-w-0"><Link href={`/judge/pageants/${pageantId}/score`} className="inline-flex items-center gap-1.5 text-[10px] font-medium text-white/65 hover:text-gold sm:text-xs"><MdArrowBack /> Back to all rounds</Link><h1 className="mt-1 truncate font-serif text-base font-bold sm:text-2xl">{round?.name ?? (loading ? "Loading round…" : "Round unavailable")}</h1></div>
      <div className="flex min-w-0 items-center gap-2 sm:max-w-[45%] sm:gap-3">{pageant?.logoUrl ? <Image src={pageant.logoUrl} alt="" width={42} height={42} className="h-9 w-9 shrink-0 border border-gold/40 bg-white object-cover sm:h-11 sm:w-11" /> : <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-gold/40 bg-white/10 font-serif text-lg font-bold text-gold sm:h-11 sm:w-11">{pageant?.name?.slice(0, 1) ?? "V"}</span>}<div className="min-w-0"><p className="truncate text-xs font-semibold sm:text-sm">{pageant?.name ?? "Pageant"}</p><p className="truncate text-[10px] text-white/55">Judge workspace</p></div></div>
    </div></header>
    <section className="container-page py-5 sm:py-7">
      {loading ? <div className="grid gap-4 md:grid-cols-2"><div className="h-44 animate-pulse border border-border bg-white"/><div className="h-44 animate-pulse border border-border bg-white"/></div> : null}
      {unavailable ? <div className="border border-amber-200 bg-white p-8 text-center"><h2 className="font-serif text-xl font-bold text-charcoal">This round is not open</h2><p className="mt-2 text-sm text-muted">Scoring is available only while the coordinator has the round open.</p><Link href={`/judge/pageants/${pageantId}/score`} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-navy">Back to all rounds</Link></div> : null}
      {!loading && !unavailable ? <>
        <div className="mb-4"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gold">Round {round?.roundNumber}</p><h2 className="mt-1 font-serif text-2xl font-bold text-charcoal">Contestants & scoring</h2></div>
        {scoringError ? <div role="alert" className="mb-5 border border-error/20 bg-error/5 p-3 text-sm text-error">Some category criteria could not be loaded. Refresh the page and try again.</div> : null}
        {categories.length === 0 ? <div className="mb-5 border border-dashed border-border bg-white p-7 text-center"><MdLock className="mx-auto text-2xl text-muted"/><p className="mt-3 font-semibold text-charcoal">No categories are assigned to this round</p></div> : null}
        <div className="sticky top-0 z-30 -mx-4 mb-5 bg-white/95 px-4 pb-3 pt-2 shadow-md shadow-navy/10 backdrop-blur-sm sm:mx-0 sm:px-0">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="min-w-0"><p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-navy">Male categories</p><nav aria-label="Male category navigation" className="mb-2 flex snap-x gap-2 overflow-x-auto py-1">{maleCategories.map((category) => {
              const selected = selectedMaleCategory?.id === category.id && category.status === "OPEN";
              const statusLabel = category.status === "OPEN" ? (category.eligibilityScope === "OPEN" ? "Open to all" : category.eligibilityScope.replaceAll("_", " ")) : category.status === "DRAFT" ? "Not yet open" : category.status === "CLOSED" ? "Closed" : "Completed";
              return <button key={category.id} type="button" disabled={category.status !== "OPEN"} onClick={() => selectGenderCategory("male", category)} aria-current={selected ? "page" : undefined} className={`max-w-[220px] shrink-0 snap-start border px-3 py-2 text-left transition ${selected ? "border-emerald-400 bg-navy text-emerald-400 shadow-md shadow-navy/20" : category.status === "OPEN" ? "border-navy bg-navy/90 text-white hover:border-gold/70 hover:bg-navy" : category.status === "CLOSED" ? "cursor-not-allowed border-error bg-error text-white" : "cursor-not-allowed border-border bg-slate/60 text-charcoal"}`}><span className={`block truncate text-xs font-bold ${category.status === "DRAFT" || category.status === "COMPLETED" ? "text-charcoal" : "text-white"} sm:text-sm`}>{category.name}</span><span className={`mt-0.5 block text-[9px] font-semibold uppercase tracking-wide ${selected ? "text-emerald-300" : category.status === "OPEN" ? "text-white/65" : category.status === "CLOSED" ? "text-white/90" : "text-muted"}`}>{statusLabel}</span>{selected ? <span className="mt-1 block text-[9px] font-extrabold uppercase tracking-[0.14em] text-emerald-300">Selected</span> : null}</button>;
            })}</nav><label className="flex items-center gap-2 rounded-sm border border-navy/25 bg-white px-3 shadow-sm transition focus-within:border-gold focus-within:ring-2 focus-within:ring-gold/25"><MdSearch className="shrink-0 text-lg text-[#87691e]"/><input value={maleSearch} onChange={(event) => setMaleSearch(event.target.value)} placeholder="Search male candidates" aria-label="Search male candidates" className="min-w-0 flex-1 bg-transparent py-2 text-sm text-charcoal outline-none placeholder:text-muted"/><span className="border-l border-border pl-3 text-[10px] font-bold uppercase tracking-wide text-navy">Male</span></label>{maleCategories.length === 0 ? <p className="mt-2 text-xs text-muted">No male categories in this round.</p> : null}</div>
            <div className="min-w-0"><p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-navy">Female categories</p><nav aria-label="Female category navigation" className="mb-2 flex snap-x gap-2 overflow-x-auto py-1">{femaleCategories.map((category) => {
              const selected = selectedFemaleCategory?.id === category.id && category.status === "OPEN";
              const statusLabel = category.status === "OPEN" ? (category.eligibilityScope === "OPEN" ? "Open to all" : category.eligibilityScope.replaceAll("_", " ")) : category.status === "DRAFT" ? "Not yet open" : category.status === "CLOSED" ? "Closed" : "Completed";
              return <button key={category.id} type="button" disabled={category.status !== "OPEN"} onClick={() => selectGenderCategory("female", category)} aria-current={selected ? "page" : undefined} className={`max-w-[220px] shrink-0 snap-start border px-3 py-2 text-left transition ${selected ? "border-emerald-400 bg-navy text-emerald-400 shadow-md shadow-navy/20" : category.status === "OPEN" ? "border-navy bg-navy/90 text-white hover:border-gold/70 hover:bg-navy" : category.status === "CLOSED" ? "cursor-not-allowed border-error bg-error text-white" : "cursor-not-allowed border-border bg-slate/60 text-charcoal"}`}><span className={`block truncate text-xs font-bold ${category.status === "DRAFT" || category.status === "COMPLETED" ? "text-charcoal" : "text-white"} sm:text-sm`}>{category.name}</span><span className={`mt-0.5 block text-[9px] font-semibold uppercase tracking-wide ${selected ? "text-emerald-300" : category.status === "OPEN" ? "text-white/65" : category.status === "CLOSED" ? "text-white/90" : "text-muted"}`}>{statusLabel}</span>{selected ? <span className="mt-1 block text-[9px] font-extrabold uppercase tracking-[0.14em] text-emerald-300">Selected</span> : null}</button>;
            })}</nav><label className="flex items-center gap-2 rounded-sm border border-navy/25 bg-white px-3 shadow-sm transition focus-within:border-gold focus-within:ring-2 focus-within:ring-gold/25"><MdSearch className="shrink-0 text-lg text-[#87691e]"/><input value={femaleSearch} onChange={(event) => setFemaleSearch(event.target.value)} placeholder="Search female candidates" aria-label="Search female candidates" className="min-w-0 flex-1 bg-transparent py-2 text-sm text-charcoal outline-none placeholder:text-muted"/><span className="border-l border-border pl-3 text-[10px] font-bold uppercase tracking-wide text-navy">Female</span></label>{femaleCategories.length === 0 ? <p className="mt-2 text-xs text-muted">No female categories in this round.</p> : null}</div>
          </div>
          {(() => { const entries = selectedScoringWorkspaces.flatMap((workspace) => workspace.candidates.map((candidate) => ({ workspace, candidate }))); const complete = entries.filter(({ workspace, candidate }) => candidateIsComplete(workspace, candidate)).length; const ready = selectedScoringWorkspaces.length > 0 && selectedScoringWorkspaces.every((workspace) => workspaceIsComplete(workspace)); const submitted = selectedScoringWorkspaces.length > 0 && selectedScoringWorkspaces.every((workspace) => workspaceWasSubmitted(workspace)); return <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-border px-3 pb-2 pt-4 sm:px-5"><div><p className="text-xs font-semibold text-charcoal">{scoringLoading ? "Loading score sheets…" : `${complete} of ${entries.length} candidates have complete scores`}</p><p className={`mt-0.5 text-[10px] ${!ready && !submitted ? "font-semibold text-error" : "text-muted"}`}>{!ready && !submitted ? "Complete every criterion for every candidate before submitting." : "Review and submit scores for the selected categories."}</p></div><div className="flex shrink-0 gap-2"><button type="button" onClick={() => setReviewingScores(true)} disabled={!selectedScoringWorkspaces.length || scoringLoading} className="border border-navy bg-white px-4 py-2.5 text-xs font-bold text-navy transition hover:border-gold hover:text-[#87691e] disabled:cursor-not-allowed disabled:opacity-50">Review scores</button><button type="button" onClick={() => void submitSelectedCategories()} disabled={!ready || submitted || finalizingScores || scoringLoading} title={!ready ? "Complete every candidate score first" : undefined} className="bg-navy px-4 py-2.5 text-xs font-bold text-white transition hover:bg-navy/90 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600">{finalizingScores ? "Submitting…" : submitted ? "Submitted" : "Submit now"}</button></div>{finalizeError ? <p role="alert" className="w-full border border-error/25 bg-error/5 px-3 py-2 text-xs text-error">{finalizeError}</p> : null}{finalizeNotice ? <p role="status" className="w-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">{finalizeNotice}</p> : null}</div>; })()}
        </div>
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <section className="min-w-0"><div className="mb-3 flex items-center justify-between border-b-2 border-gold pb-2"><h3 className="font-serif text-xl font-bold text-navy">Male</h3><span className="text-xs text-muted">{maleContestants.length} candidates</span></div><div className="flex snap-x gap-4 overflow-x-auto pb-4">{maleContestants.length ? maleContestants.map((candidate) => candidateCard(candidate, "male")) : <p className="w-full border border-dashed border-border bg-surface p-5 text-sm text-muted">No matching male contestants.</p>}</div></section>
          <section className="min-w-0"><div className="mb-3 flex items-center justify-between border-b-2 border-gold pb-2"><h3 className="font-serif text-xl font-bold text-navy">Female</h3><span className="text-xs text-muted">{femaleContestants.length} candidates</span></div><div className="flex snap-x gap-4 overflow-x-auto pb-4">{femaleContestants.length ? femaleContestants.map((candidate) => candidateCard(candidate, "female")) : <p className="w-full border border-dashed border-border bg-surface p-5 text-sm text-muted">No matching female contestants.</p>}</div></section>
        </div>
        {reviewPanel(selectedScoringWorkspaces, reviewingScores, () => setReviewingScores(false))}
      </> : null}
    </section>
  </main>;
}
