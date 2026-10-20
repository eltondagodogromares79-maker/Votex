"use client";

import { useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { Modal } from "@/src/components/ui/Modal";
import { Button } from "@/src/components/ui/Button";
import { useToast } from "@/src/components/ui/Toast";
import { ApiError } from "@/src/lib/api/client";
import { coordinatorApi } from "@/src/features/coordinator/api/coordinator";
import { useRounds } from "@/src/features/coordinator/hooks/useRounds";
import { useCategories, useCreateCriterion, useCriteria, useRoundJudgingConfiguration } from "@/src/features/coordinator/hooks/useCategories";
import EditCriterionModal from "./EditCriterion";
import DeactivateCriterionModal from "./DeactivateCriterion";
import type { CategoryResponse, CriterionResponse, RoundCriterionConfig } from "@/src/types";

type Props = {
  pageantId: string;
  category: CategoryResponse | null;
  onClose: () => void;
};

type NewCriterionDraft = { id: string; name: string; points: string };

export default function ManageCategoryCriteriaModal({ pageantId, category, onClose }: Props) {
  return <ManageCategoryCriteriaModalContent key={category?.id ?? "closed"} pageantId={pageantId} category={category} onClose={onClose} />;
}

function ManageCategoryCriteriaModalContent({ pageantId, category, onClose }: Props) {
  const open = !!category;
  const { data: rounds = [], isLoading: roundsLoading } = useRounds(pageantId);
  const { toast } = useToast();
  const roundConfigurations = useQueries({
    queries: rounds.map((round) => ({
      queryKey: ["coordinator", "pageants", pageantId, "rounds", round.id, "judging-configuration"],
      queryFn: () => coordinatorApi.getRoundJudgingConfiguration(pageantId, round.id),
      enabled: open,
    })),
  });
  const associatedRound = useMemo(() => {
    if (!category) return undefined;
    const index = roundConfigurations.findIndex((query) => query.data?.categoryIds.includes(category.id));
    return index >= 0 ? rounds[index] : undefined;
  }, [category, roundConfigurations, rounds]);
  const roundId = associatedRound?.id ?? "";
  const { data: configuration, isLoading: configurationLoading, save } = useRoundJudgingConfiguration(pageantId, roundId);
  const { data: categories = [], isLoading: categoriesLoading } = useCategories(pageantId);
  const { data: criteria = [], isLoading: criteriaLoading } = useCriteria(pageantId);
  const createCriterion = useCreateCriterion(pageantId);
  const [linksOverride, setLinksOverride] = useState<RoundCriterionConfig[] | null>(null);
  const [newCriteria, setNewCriteria] = useState<NewCriterionDraft[]>([]);
  const [showExistingCriteria, setShowExistingCriteria] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<CriterionResponse | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<CriterionResponse | null>(null);

  const links = linksOverride ?? configuration?.criteria.filter((item) => item.categoryId === category?.id) ?? [];
  const categoryInRound = !!category && !!configuration?.categoryIds.includes(category.id);
  const activeCriteria = criteria.filter((criterion) => criterion.isActive || links.some((link) => link.criterionId === criterion.id));
  const availableCriteria = activeCriteria.filter((criterion) => criterion.isActive && !links.some((link) => link.criterionId === criterion.id));
  const inactiveLinkedCriteria = links.flatMap((link) => {
    const criterion = criteria.find((item) => item.id === link.criterionId);
    return criterion && !criterion.isActive ? [criterion.name] : [];
  });
  const validCategoryIds = new Set(categories.filter((item) => item.isActive).map((item) => item.id));
  const validCriterionIds = new Set(criteria.filter((item) => item.isActive).map((item) => item.id));
  const staleOtherAssignments = (configuration?.criteria ?? []).filter((item) => item.categoryId !== category?.id && (!validCategoryIds.has(item.categoryId) || !validCriterionIds.has(item.criterionId)));
  const total = links.reduce((sum, link) => sum + (Number(link.weightPercentage) || 0), 0);

  function updateLinks(updater: (current: RoundCriterionConfig[]) => RoundCriterionConfig[]) {
    setLinksOverride((current) => updater(current ?? configuration?.criteria.filter((item) => item.categoryId === category?.id) ?? []));
  }

  function toggleCriterion(criterion: CriterionResponse) {
    updateLinks((current) => {
      const existing = current.find((link) => link.criterionId === criterion.id);
      if (existing) return current.filter((link) => link.criterionId !== criterion.id);
      return [...current, {
        categoryId: category!.id,
        criterionId: criterion.id,
        weightPercentage: current.length ? "0" : "100",
        maximumScore: criterion.defaultMaximumScore,
        minimumScore: criterion.defaultMinimumScore,
        displayOrder: current.length,
      }];
    });
  }

  function updateLink(criterionId: string, field: "weightPercentage" | "maximumScore" | "minimumScore", value: string) {
    updateLinks((current) => current.map((link) => link.criterionId === criterionId ? { ...link, [field]: value } : link));
  }

  async function saveCriteria() {
    if (!configuration || !category || !roundId || categoriesLoading) return;
    setSaveError(null);
    if (!category.isActive) {
      setSaveError("Reactivate this category before adding or changing its criteria.");
      return;
    }
    if (!categoryInRound) {
      setSaveError("This category is not selected for its round. Assign it to a round before saving criteria.");
      return;
    }
    if (inactiveLinkedCriteria.length) {
      setSaveError(`Remove inactive criteria before saving: ${inactiveLinkedCriteria.join(", ")}.`);
      return;
    }
    if (newCriteria.some((item) => !item.name.trim() || !Number.isFinite(Number(item.points)) || Number(item.points) <= 0 || Number(item.points) > 100)) {
      setSaveError("Enter a name and a score from greater than 0 up to 100 for every new criterion.");
      return;
    }
    if (links.some((link) => !Number.isFinite(Number(link.weightPercentage)) || Number(link.weightPercentage) <= 0 || Number(link.weightPercentage) > 100)) {
      setSaveError("Each criterion score must be greater than 0 and no more than 100.");
      return;
    }
    const combinedTotalUnits = links.reduce((sum, link) => sum + Math.round(Number(link.weightPercentage) * 10000), 0)
      + newCriteria.reduce((sum, item) => sum + Math.round(Number(item.points) * 10000), 0);
    const combinedTotal = combinedTotalUnits / 10000;
    if (combinedTotalUnits !== 1_000_000) {
      setSaveError(`Criteria points must total exactly 100. Current total: ${combinedTotal.toFixed(2)}.`);
      return;
    }
    if (links.some((link) => !Number.isFinite(Number(link.maximumScore)) || Number(link.maximumScore) <= 0 || !Number.isFinite(Number(link.minimumScore)) || Number(link.minimumScore) < 0 || Number(link.minimumScore) > Number(link.maximumScore))) {
      setSaveError("Each scoring range needs a positive maximum and a minimum no greater than the maximum.");
      return;
    }
    try {
      const updatedLinks = [...links];
      for (const [index, draft] of newCriteria.entries()) {
        const codeName = draft.name.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 20) || "CRITERION";
        const criterion = await createCriterion.mutateAsync({
          code: `CR_${codeName}_${crypto.randomUUID().slice(0, 8).toUpperCase()}`.slice(0, 80),
          name: draft.name.trim(),
          description: null,
          defaultMaximumScore: "100",
          defaultMinimumScore: "0",
        });
        updatedLinks.push({
          categoryId: category.id,
          criterionId: criterion.id,
          weightPercentage: draft.points,
          maximumScore: criterion.defaultMaximumScore,
          minimumScore: criterion.defaultMinimumScore,
          displayOrder: links.length + index,
        });
      }
      await save.mutateAsync({
        categoryIds: configuration.categoryIds,
        categories: configuration.categories,
        criteria: [
          ...configuration.criteria.filter((item) => item.categoryId !== category.id && validCategoryIds.has(item.categoryId) && validCriterionIds.has(item.criterionId)),
          ...updatedLinks,
        ],
      });
      toast.success(`Criteria for ${category.name} saved.`);
      onClose();
    } catch (error) {
      setSaveError(error instanceof ApiError ? error.userMessage : "Could not save criteria.");
    }
  }

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={category ? `Manage criteria · ${category.name}` : "Manage criteria"}
        description="Give this category its judging criteria. Their points must add up to 100."
        size="lg"
        footer={<>
          <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
          <Button variant="secondary" size="sm" onClick={saveCriteria} loading={save.isPending || createCriterion.isPending} disabled={!categoryInRound || !category?.isActive || configurationLoading || criteriaLoading || categoriesLoading}>Save Criteria</Button>
        </>}
      >
        {roundsLoading || roundConfigurations.some((query) => query.isLoading) ? (
          <p className="text-small text-white/70">Finding this category’s round…</p>
        ) : !associatedRound ? (
          <p className="border border-amber-300/30 bg-amber-300/10 p-4 text-small text-white/80">This category is not assigned to a round yet. Edit the category and select a round before adding criteria.</p>
        ) : configurationLoading || criteriaLoading ? (
          <p className="text-small text-white/70">Loading criteria…</p>
        ) : !category?.isActive ? (
          <p className="border border-amber-300/30 bg-amber-300/10 p-4 text-small text-white/80">This category is inactive. Reactivate it in the category list before managing its criteria.</p>
        ) : !categoryInRound ? (
          <p className="text-small text-white/70">This category is not included in {associatedRound.name}.</p>
        ) : (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3">
              <div><p className="text-[11px] font-semibold uppercase tracking-wide text-white/50">Assigned round</p><p className="mt-1 text-small font-medium text-white">{associatedRound.name}</p></div>
              <div className="min-w-36 text-right"><p className="text-[11px] font-semibold uppercase tracking-wide text-white/50">Points assigned</p><p className={`mt-1 text-lg font-semibold tabular-nums ${Math.round((total + newCriteria.reduce((sum, item) => sum + (Number(item.points) || 0), 0)) * 100) === 10000 ? "text-green-300" : "text-amber-200"}`}>{(total + newCriteria.reduce((sum, item) => sum + (Number(item.points) || 0), 0)).toFixed(2)} <span className="text-small font-normal text-white/50">/ 100</span></p></div>
            </div>
            {saveError ? <p role="alert" className="border border-red-300/30 bg-red-400/10 px-3 py-2 text-small text-red-200">{saveError}</p> : null}
            {staleOtherAssignments.length ? <p className="border border-amber-300/25 bg-amber-300/[0.08] px-3 py-2 text-caption leading-relaxed text-amber-100">This round has {staleOtherAssignments.length} inactive or unavailable criterion assignment{staleOtherAssignments.length === 1 ? "" : "s"} in another category. Saving will clear those stale assignments so they don’t block this update.</p> : null}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3"><div><h4 className="text-small font-semibold text-white">Criteria</h4><p className="mt-0.5 text-caption text-white/50">Enter only a name and its share of the 100 points.</p></div><span className="rounded-full bg-white/10 px-2.5 py-1 text-caption text-white/70">{links.length + newCriteria.length} items</span></div>
              {links.map((link) => {
                const criterion = criteria.find((item) => item.id === link.criterionId);
                return <div key={link.criterionId} className="grid grid-cols-[minmax(0,1fr)_84px] items-center gap-2 rounded-lg border border-white/10 bg-white/[0.035] p-3 sm:grid-cols-[minmax(0,1fr)_110px_auto] sm:gap-3">
                  <div className="min-w-0"><p className="break-words text-small font-medium text-white">{criterion?.name ?? "Criterion"}</p>{criterion && !criterion.isActive ? <p className="mt-0.5 text-caption text-amber-200">Inactive · remove it to continue</p> : null}</div>
                  <label className="block"><span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-white/45">Points</span><input type="number" min="0.01" max="100" step="0.01" value={link.weightPercentage} onChange={(event) => updateLink(link.criterionId, "weightPercentage", event.target.value)} aria-label={`${criterion?.name ?? "Criterion"} points`} className="h-9 w-full rounded border border-white/15 bg-white/[0.06] px-2 text-right text-small text-white focus:border-gold focus:outline-none" /></label>
                  <div className="col-span-2 flex items-center justify-end gap-1 sm:col-span-1"><button type="button" onClick={() => criterion && setEditTarget(criterion)} disabled={!criterion} className="rounded px-2 py-2 text-caption font-semibold text-white/70 hover:bg-white/10 disabled:opacity-30">Edit</button>{criterion?.isActive ? <button type="button" onClick={() => setDeactivateTarget(criterion)} className="rounded px-2 py-2 text-caption font-semibold text-amber-200 hover:bg-amber-300/10">Deactivate</button> : null}<button type="button" aria-label={`Remove ${criterion?.name ?? "criterion"}`} onClick={() => criterion && toggleCriterion(criterion)} className="rounded px-2 py-2 text-caption font-semibold text-red-200 hover:bg-red-400/10">Remove</button></div>
                </div>;
              })}
              {newCriteria.map((draft, index) => <div key={draft.id} className="grid grid-cols-[minmax(0,1fr)_84px] items-center gap-2 rounded-lg border border-gold/25 bg-gold/[0.06] p-3 sm:grid-cols-[minmax(0,1fr)_110px_auto] sm:gap-3">
                <label className="block min-w-0"><span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-white/45">Name</span><input value={draft.name} onChange={(event) => setNewCriteria((items) => items.map((item) => item.id === draft.id ? { ...item, name: event.target.value } : item))} className="h-9 w-full rounded border border-white/15 bg-white/[0.06] px-2 text-small text-white focus:border-gold focus:outline-none" placeholder="e.g. Poise" /></label>
                <label className="block"><span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-white/45">Points</span><input type="number" min="0.01" max="100" step="0.01" value={draft.points} onChange={(event) => setNewCriteria((items) => items.map((item) => item.id === draft.id ? { ...item, points: event.target.value } : item))} className="h-9 w-full rounded border border-white/15 bg-white/[0.06] px-2 text-right text-small text-white focus:border-gold focus:outline-none" placeholder="25" /></label>
                <button type="button" aria-label={`Remove new criterion ${index + 1}`} onClick={() => setNewCriteria((items) => items.filter((item) => item.id !== draft.id))} className="col-span-2 justify-self-end rounded px-2 py-2 text-caption font-semibold text-red-200 hover:bg-red-400/10 sm:col-span-1">Remove</button>
              </div>)}
              {!links.length && !newCriteria.length ? <p className="rounded-lg border border-dashed border-white/15 px-4 py-6 text-center text-small text-white/55">No criteria added yet. Add one to start configuring this category.</p> : null}
            </div>
            <div className="flex flex-wrap gap-2 border-t border-white/10 pt-4">
              <button type="button" onClick={() => setNewCriteria((current) => [...current, { id: crypto.randomUUID(), name: "", points: "" }])} className="rounded border border-gold/40 px-3 py-2 text-caption font-semibold text-gold hover:bg-gold/10">+ New criterion</button>
              <button type="button" onClick={() => setShowExistingCriteria((value) => !value)} disabled={!availableCriteria.length} className="rounded border border-white/15 px-3 py-2 text-caption font-semibold text-white/80 hover:bg-white/5 disabled:opacity-40">{showExistingCriteria ? "Hide existing" : "Add existing"}</button>
            </div>
            {showExistingCriteria ? <div className="max-h-44 space-y-2 overflow-y-auto rounded-lg border border-white/10 bg-black/10 p-3">
              {availableCriteria.length ? availableCriteria.map((criterion) => <button key={criterion.id} type="button" onClick={() => toggleCriterion(criterion)} className="flex w-full items-center justify-between gap-3 rounded px-2.5 py-2 text-left text-small text-white hover:bg-white/10"><span className="min-w-0 break-words">{criterion.name}</span><span className="shrink-0 text-caption font-semibold text-gold">Add</span></button>) : <p className="text-caption text-white/55">All active criteria are already selected.</p>}
            </div> : null}
          </div>
        )}
      </Modal>
      <EditCriterionModal pageantId={pageantId} criterion={editTarget} onClose={() => setEditTarget(null)} />
      <DeactivateCriterionModal pageantId={pageantId} criterion={deactivateTarget} onClose={() => setDeactivateTarget(null)} />
    </>
  );
}
