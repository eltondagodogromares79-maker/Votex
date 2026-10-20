"use client";

import { useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { useActivateCategory, useCategories, useCriteria, useRoundJudgingConfiguration, useUpdateCategoryStatus } from "@/src/features/coordinator/hooks/useCategories";
import AddCategoryModal from "../modals/AddCategory";
import EditCategoryModal from "../modals/EditCategory";
import DeactivateCategoryModal from "../modals/DeactivateCategory";
import ManageCategoryCriteriaModal from "../modals/ManageCategoryCriteria";
import type { CategoryResponse, RoundResponse } from "@/src/types";
import { useToast } from "@/src/components/ui/Toast";
import { ApiError } from "@/src/lib/api/client";
import { usePageantResourceLimits } from "@/src/features/coordinator/hooks/usePageants";
import { useRounds, useUpdateRound } from "@/src/features/coordinator/hooks/useRounds";
import { coordinatorApi } from "@/src/features/coordinator/api/coordinator";

type CategoriesSectionProps = {
  pageantId: string;
  focusRoundId?: string | null;
};

function ListLoading() {
  return (
    <div className="mt-6 border border-border">
      <div className="px-5 py-4 border-b border-border bg-slate/20">
        <div className="h-4 w-32 bg-slate rounded animate-pulse" />
      </div>

      <div className="divide-y divide-border">
        {[1, 2, 3, 4, 5].map((item) => (
          <div
            key={item}
            className="px-5 py-4 flex items-center gap-4 animate-pulse"
          >
            <div className="w-10 h-10 rounded-full bg-slate shrink-0" />

            <div className="flex-1 space-y-2">
              <div className="h-4 w-40 bg-slate rounded" />
              <div className="h-3 w-24 bg-slate rounded" />
            </div>

            <div className="h-6 w-16 bg-slate rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ category }: { category: CategoryResponse }) {
  const label = !category.isActive ? "Inactive" : category.status === "COMPLETED" ? "Completed" : category.status[0] + category.status.slice(1).toLowerCase();
  const style = !category.isActive || category.status === "DRAFT"
    ? "bg-slate/50 text-muted border border-border"
    : category.status === "OPEN"
      ? "bg-green-50 text-green-700 border border-green-200"
      : category.status === "CLOSED"
        ? "bg-error/10 text-error border border-error/20"
        : "bg-gold/10 text-navy border border-gold/40";
  return (
    <span className={`inline-flex items-center px-2.5 py-1 text-[11px] font-semibold ${style}`}>{label}</span>
  );
}

function eligibilityLabel(scope: string, notes: string | null) {
  const labels: Record<string, string> = {
    OPEN: "Open to all",
    WOMEN: "Female",
    MEN: "Male",
    LGBTQ_PLUS: "LGBTQ+ division",
    CUSTOM: "Custom eligibility",
  };
  return notes ? `${labels[scope] ?? scope}: ${notes}` : labels[scope] ?? scope;
}

const listActionClass = "inline-flex min-h-8 items-center justify-center rounded px-3 py-1.5 text-caption font-semibold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50";

export default function CategoriesSection({
  pageantId,
  focusRoundId,
}: CategoriesSectionProps) {
  const { data: limits, isLoading: isLoadingLimits } = usePageantResourceLimits(pageantId);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [editCategoryTarget, setEditCategoryTarget] = useState<CategoryResponse | null>(null);
  const [deactivateCategoryTarget, setDeactivateCategoryTarget] = useState<CategoryResponse | null>(null);
  const [criteriaCategoryTarget, setCriteriaCategoryTarget] = useState<CategoryResponse | null>(null);
  const [selectedRoundId, setSelectedRoundId] = useState<string | null>(focusRoundId ?? null);
  const categoryLimit = limits?.maxCategoriesPerRound;
  const hasAvailableCategorySlot = (limits?.roundCategories ?? []).some((round) => categoryLimit == null || round.categoriesUsed < categoryLimit);
  const canAddCategory = !!limits?.hasActiveSubscription && hasAvailableCategorySlot;
  const categoryLimitMessage = !limits?.hasActiveSubscription
    ? "An active subscription is required to add categories."
    : !limits.roundCategories.length
      ? "Create a round before adding categories."
      : "Every round has reached its category limit.";

  return (
    <>
      <div className="bg-surface border border-border p-5">
        <div>
          <h4 className="font-serif font-semibold text-charcoal text-h3">
            Categories
          </h4>

          <p className="text-small text-muted mt-1">
            Manage judging categories and their scoring criteria for this pageant.
          </p>
        </div>
        <section aria-label="Category slots per round" className="mt-5 border border-border bg-slate/25 p-4 sm:p-5">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h5 className="text-small font-semibold text-charcoal">Category slots by round</h5>
              <p className="mt-0.5 text-caption text-muted">Your plan limit applies separately to each round.</p>
            </div>
            {limits?.hasActiveSubscription && limits.maxCategoriesPerRound === null ? <span className="text-caption font-semibold text-green-700">Unlimited categories per round</span> : null}
          </div>
          {isLoadingLimits ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((item) => <div key={item} className="h-20 animate-pulse border border-border bg-white" />)}</div>
          ) : !limits?.hasActiveSubscription ? (
            <p className="border border-amber-200 bg-amber-50 px-3 py-2.5 text-caption text-amber-800">An active subscription is needed to see category limits.</p>
          ) : (limits.roundCategories ?? []).length === 0 ? (
            <p className="border border-dashed border-border bg-white px-3 py-5 text-center text-caption text-muted">Create a round to see its category slots.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(limits.roundCategories ?? []).map((round) => {
                const cap = limits.maxCategoriesPerRound;
                const remaining = cap === null ? null : Math.max(0, cap - round.categoriesUsed);
                const progress = cap === null ? 0 : Math.min(100, cap > 0 ? round.categoriesUsed / cap * 100 : 100);
                const selected = selectedRoundId === round.roundId;
                return <button key={round.roundId} type="button" aria-pressed={selected} onClick={() => setSelectedRoundId(round.roundId)} className={`w-full border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${selected ? "border-navy bg-navy/5 ring-1 ring-navy/10" : "border-border bg-white hover:border-gold/70 hover:bg-gold/5"}`}>
                  <span className="flex items-center justify-between gap-2"><span className="truncate text-small font-semibold text-charcoal">{round.roundName}</span><span className={`shrink-0 text-[10px] font-bold uppercase tracking-wide ${selected ? "text-navy" : "text-gold"}`}>{selected ? "Selected" : "View categories"}</span></span>
                  {cap === null ? <p className="mt-1 text-caption text-green-700">{round.categoriesUsed} categories · No limit</p> : <>
                    <p className="mt-1 text-caption text-muted">{round.categoriesUsed} of {cap} used · <span className="font-semibold text-charcoal">{remaining} remaining</span></p>
                    <span className="mt-2 block h-1.5 overflow-hidden bg-slate"><span className={`block h-full ${remaining === 0 ? "bg-red-500" : remaining !== null && remaining <= 1 ? "bg-amber-500" : "bg-gold"}`} style={{ width: `${progress}%` }} /></span>
                  </>}
                </button>;
              })}
            </div>
          )}
        </section>
        <CategoriesList
          pageantId={pageantId}
          selectedRoundId={selectedRoundId}
          onAdd={() => setIsAddCategoryOpen(true)}
          canAdd={canAddCategory}
          limitMessage={categoryLimitMessage}
          onEdit={setEditCategoryTarget}
          onDeactivate={setDeactivateCategoryTarget}
          onManageCriteria={setCriteriaCategoryTarget}
        />
      </div>

      {/* Category modals */}
      <AddCategoryModal
        pageantId={pageantId}
        open={isAddCategoryOpen}
        onClose={() => setIsAddCategoryOpen(false)}
      />
      <EditCategoryModal
        pageantId={pageantId}
        category={editCategoryTarget}
        onClose={() => setEditCategoryTarget(null)}
      />
      <DeactivateCategoryModal
        pageantId={pageantId}
        category={deactivateCategoryTarget}
        onClose={() => setDeactivateCategoryTarget(null)}
      />

      <ManageCategoryCriteriaModal
        pageantId={pageantId}
        category={criteriaCategoryTarget}
        onClose={() => setCriteriaCategoryTarget(null)}
      />
    </>
  );
}

function CategoriesList({
  pageantId,
  selectedRoundId,
  onAdd,
  canAdd,
  limitMessage,
  onEdit,
  onDeactivate,
  onManageCriteria,
}: {
  pageantId: string;
  selectedRoundId: string | null;
  onAdd: () => void;
  canAdd: boolean;
  limitMessage: string;
  onEdit: (category: CategoryResponse) => void;
  onDeactivate: (category: CategoryResponse) => void;
  onManageCriteria: (category: CategoryResponse) => void;
}) {
  const { data: categories, isLoading, isError, error } = useCategories(pageantId);
  const { data: rounds = [], isLoading: roundsLoading } = useRounds(pageantId);
  const { data: criteria = [], isLoading: criteriaLoading, isError: criteriaIsError } = useCriteria(pageantId);
  const roundConfigurations = useQueries({
    queries: rounds.map((round) => ({
      queryKey: ["coordinator", "pageants", pageantId, "rounds", round.id, "judging-configuration"],
      queryFn: () => coordinatorApi.getRoundJudgingConfiguration(pageantId, round.id),
    })),
  });
  const activateCategory = useActivateCategory(pageantId);
  const updateCategoryStatus = useUpdateCategoryStatus(pageantId);
  const { toast } = useToast();
  const criteriaSummary = useMemo(() => {
    const summaries = new Map<string, { count: number; total: number; items: { id: string; name: string; points: string }[] }>();
    if (roundsLoading || criteriaLoading || roundConfigurations.some((query) => query.isLoading)) return summaries;
    const criterionNames = new Map(criteria.map((item) => [item.id, item.name]));

    for (const category of categories ?? []) {
      const config = roundConfigurations.find((query) => query.data?.categoryIds.includes(category.id))?.data;
      if (!config) continue;
      const links = config.criteria.filter((item) => item.categoryId === category.id);
      summaries.set(category.id, {
        count: links.length,
        total: links.reduce((sum, item) => sum + (Number(item.weightPercentage) || 0), 0),
        items: links.map((item) => ({ id: item.criterionId, name: criterionNames.get(item.criterionId) ?? "Criterion", points: item.weightPercentage })),
      });
    }
    return summaries;
  }, [categories, criteria, criteriaLoading, roundConfigurations, roundsLoading]);
  const isLoadingCriteria = roundsLoading || criteriaLoading || roundConfigurations.some((query) => query.isLoading);
  const criteriaQueryFailed = criteriaIsError || roundConfigurations.some((query) => query.isError);

  function criteriaPointsLabel(categoryId: string) {
    if (isLoadingCriteria) return "Criteria points: Loading…";
    if (criteriaQueryFailed) return "Criteria points unavailable";
    const summary = criteriaSummary.get(categoryId);
    return summary?.count
      ? `Criteria points: ${summary.total.toFixed(2)} / 100`
      : "No criteria yet";
  }

  async function activate(category: CategoryResponse) {
    try { await activateCategory.mutateAsync(category.id); toast.success(`${category.name} is active again.`); }
    catch (error) { toast.error(error instanceof ApiError ? error.userMessage : "Could not reactivate category."); }
  }

  if (isLoading) {
    return <ListLoading />;
  }

  if (isError) {
    return (
      <div className="mt-6 border border-red-200 bg-red-50 p-5">
        <p className="text-small font-semibold text-red-700">
          Unable to load categories
        </p>

        <p className="text-caption text-red-600 mt-1">
          {error instanceof Error
            ? error.message
            : "Something went wrong while loading the categories."}
        </p>
      </div>
    );
  }

  const categoryList = categories ?? [];
  const selectedRound = rounds.find((round) => round.id === selectedRoundId) ?? null;
  const roundCategoryIds = roundConfigurations.find((query, index) => rounds[index]?.id === selectedRound?.id)?.data?.categoryIds ?? [];
  const visibleCategories = selectedRound ? categoryList.filter((category) => roundCategoryIds.includes(category.id)) : [];

  async function changeCategoryStatus(category: CategoryResponse, status: CategoryResponse["status"]) {
    try {
      await updateCategoryStatus.mutateAsync({ categoryId: category.id, status });
      const label = status === "COMPLETED" ? "completed" : status.toLowerCase();
      toast.success(`${category.name} is now ${label}.`);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.userMessage : error instanceof Error ? error.message : "Could not update category status.");
    }
  }

  function categoryStatusActions(category: CategoryResponse) {
    const summary = criteriaSummary.get(category.id);
    const canOpen = selectedRound?.status === "OPEN" && !!summary?.count && Math.round(summary.total * 100) === 10000;
    const actionClass = `${listActionClass} bg-navy text-white hover:bg-navy/90 focus-visible:ring-navy`;
    if (!category.isActive || category.status === "COMPLETED") return null;
    if (category.status === "DRAFT") return <button type="button" disabled={!canOpen || updateCategoryStatus.isPending} title={!selectedRound || selectedRound.status !== "OPEN" ? "Open this category's round first." : !summary?.count || Math.round((summary?.total ?? 0) * 100) !== 10000 ? "Add criteria totaling 100 points first." : undefined} onClick={() => void changeCategoryStatus(category, "OPEN")} className={actionClass}>Open category</button>;
    if (category.status === "OPEN") return <button type="button" disabled={updateCategoryStatus.isPending} onClick={() => void changeCategoryStatus(category, "CLOSED")} className={`${listActionClass} bg-error text-white hover:bg-error/90 focus-visible:ring-error`}>Close category</button>;
    return <>
      <button type="button" disabled={!canOpen || updateCategoryStatus.isPending} title={!canOpen ? "The round must be open and category criteria must total 100 points." : undefined} onClick={() => void changeCategoryStatus(category, "OPEN")} className={actionClass}>Reopen category</button>
      <button type="button" disabled={updateCategoryStatus.isPending} onClick={() => void changeCategoryStatus(category, "DRAFT")} className={`${listActionClass} border border-navy text-navy hover:bg-navy/5 focus-visible:ring-navy`}>Return to draft</button>
      <button type="button" disabled={updateCategoryStatus.isPending} onClick={() => void changeCategoryStatus(category, "COMPLETED")} className={`${listActionClass} bg-gold text-navy hover:bg-gold/80 focus-visible:ring-gold`}>Mark completed</button>
    </>;
  }

  return (
    <div className="mt-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-small font-semibold text-charcoal">
            {selectedRound ? visibleCategories.length : categoryList.length}
          </span>

          <span className="text-small text-muted">
            {selectedRound ? (visibleCategories.length === 1 ? "category in selected round" : "categories in selected round") : categoryList.length === 1 ? "category" : "categories"}
          </span>
        </div>

        <button
          type="button"
          onClick={onAdd}
          disabled={!canAdd}
          title={!canAdd ? limitMessage : undefined}
          className="self-start bg-gold px-4 py-2.5 text-small font-semibold text-navy transition-colors hover:bg-gold/60 hover:text-navy focus:outline-none focus:ring-2 focus:ring-navy focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          + Add Category
        </button>
      </div>
      {!canAdd ? <p className="mt-2 text-caption text-amber-700">{limitMessage}</p> : null}

      {selectedRound ? <RoundCategoryWeightsEditor key={selectedRound.id} pageantId={pageantId} round={selectedRound} categories={categoryList} /> : <p className="mt-5 border border-dashed border-border bg-slate/20 px-5 py-6 text-center text-small text-muted">Select a round above to view its categories and category weights.</p>}

      {selectedRound && visibleCategories.length === 0 ? (
        <div className="mt-5 border border-dashed border-border px-6 py-12 text-center">
          <div className="mx-auto w-12 h-12 flex items-center justify-center bg-slate/50 text-navy">
            <span className="text-xl font-serif font-bold">C</span>
          </div>

          <h5 className="mt-4 text-small font-semibold text-charcoal">
            No categories yet
          </h5>

          <p className="mt-1 text-caption text-muted max-w-sm mx-auto">
            Add categories to organize how candidates are judged in this pageant.
          </p>

          <button
            type="button"
            onClick={onAdd}
            disabled={!canAdd}
            className="mt-4 text-small font-semibold text-navy hover:underline disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add your first category
          </button>
        </div>
      ) : selectedRound ? (
        <div className="mt-5 border border-border overflow-hidden">
          <div className="hidden xl:grid xl:grid-cols-[90px_minmax(150px,1.2fr)_minmax(170px,1.2fr)_70px_82px_minmax(250px,1.5fr)] gap-3 px-4 py-3 bg-slate/30 border-b border-border">
            <p className="text-caption font-semibold text-muted uppercase tracking-wide">
              Code
            </p>
            <p className="text-caption font-semibold text-muted uppercase tracking-wide">
              Name
            </p>
            <p className="text-caption font-semibold text-muted uppercase tracking-wide">
              Criteria
            </p>
            <p className="text-caption font-semibold text-muted uppercase tracking-wide">
              Display Order
            </p>
            <p className="text-caption font-semibold text-muted uppercase tracking-wide">
              Status
            </p>
            <p className="text-caption font-semibold text-muted uppercase tracking-wide text-right">
              Actions
            </p>
          </div>

          <div className="divide-y divide-border">
            {visibleCategories.map((category) => (
              <div
                key={category.id}
                className="px-5 py-4 transition-colors hover:bg-slate/10"
              >
                {/* Desktop */}
                <div className="hidden xl:grid xl:grid-cols-[90px_minmax(150px,1.2fr)_minmax(170px,1.2fr)_70px_82px_minmax(250px,1.5fr)] gap-3 items-center">
                  <div className="min-w-0">
                    <span className="break-words [overflow-wrap:anywhere] text-small font-semibold text-navy">
                      {category.code}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <p className="text-small font-semibold text-charcoal break-words [overflow-wrap:anywhere]">
                      {category.name}
                    </p>
                    <p className="text-caption text-muted break-words [overflow-wrap:anywhere]">
                      {eligibilityLabel(category.eligibilityScope, category.eligibilityNotes)}
                    </p>
                  </div>

                  <div className="min-w-0 space-y-1 break-words [overflow-wrap:anywhere]">
                    {criteriaSummary.get(category.id)?.items.length ? criteriaSummary.get(category.id)!.items.map((item) => <p key={item.id} className="text-caption text-charcoal">{item.name} <span className="font-semibold text-navy">{Number(item.points).toFixed(2)} pts</span></p>) : <p className="text-caption text-muted">{criteriaPointsLabel(category.id)}</p>}
                  </div>

                  <div>
                    <p className="text-small text-charcoal">
                      {category.displayOrder}
                    </p>
                  </div>

                  <div>
                    <StatusBadge category={category} />
                  </div>

                  <div className="flex flex-wrap justify-end gap-2">
                    {categoryStatusActions(category)}
                    <button type="button" onClick={() => onManageCriteria(category)} className={`${listActionClass} bg-gold text-navy hover:bg-gold/80 focus-visible:ring-gold`}>Manage criteria</button>
                    <button
                      type="button"
                      onClick={() => onEdit(category)}
                      className={`${listActionClass} bg-navy text-white hover:bg-navy/90 focus-visible:ring-navy`}
                    >
                      Edit
                    </button>
                    {category.isActive ? <button type="button" onClick={() => onDeactivate(category)} className={`${listActionClass} bg-error text-white hover:bg-error/90 focus-visible:ring-error`}>Deactivate</button> : <button type="button" disabled={activateCategory.isPending} onClick={() => activate(category)} className={`${listActionClass} bg-success text-white hover:bg-success/90 focus-visible:ring-success`}>Reactivate</button>}
                  </div>
                </div>

                {/* Mobile */}
                <div className="xl:hidden">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                          <p className="text-small font-semibold text-charcoal break-words [overflow-wrap:anywhere]">
                            {category.name}
                          </p>
                      <p className="text-caption text-muted break-words [overflow-wrap:anywhere]">
                        {eligibilityLabel(category.eligibilityScope, category.eligibilityNotes)}
                      </p>
                      <div className="mt-2 border-l-2 border-gold/60 pl-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Criteria & points</p>
                        {criteriaSummary.get(category.id)?.items.length ? criteriaSummary.get(category.id)!.items.map((item) => <p key={item.id} className="mt-0.5 text-caption text-charcoal break-words [overflow-wrap:anywhere]">{item.name} <span className="font-semibold text-navy">{Number(item.points).toFixed(2)} pts</span></p>) : <p className="mt-0.5 text-caption text-muted">{criteriaPointsLabel(category.id)}</p>}
                      </div>

                      <p className="text-caption text-muted mt-0.5 break-words [overflow-wrap:anywhere]">
                        {category.code}
                      </p>
                    </div>

                    <StatusBadge category={category} />
                  </div>

                  <div className="flex flex-wrap items-end gap-x-4 gap-y-3 mt-3">
                    <div>
                      <p className="text-[11px] text-muted uppercase tracking-wide">
                        Display Order
                      </p>

                      <p className="text-caption text-charcoal mt-0.5">
                        {category.displayOrder}
                      </p>
                    </div>

                    <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
                      {categoryStatusActions(category)}
                      <button type="button" onClick={() => onManageCriteria(category)} className={`${listActionClass} bg-gold text-navy hover:bg-gold/80 focus-visible:ring-gold`}>Manage criteria</button>
                      <button
                        type="button"
                        onClick={() => onEdit(category)}
                        className={`${listActionClass} bg-navy text-white hover:bg-navy/90 focus-visible:ring-navy`}
                      >
                        Edit
                      </button>
                      {category.isActive ? <button type="button" onClick={() => onDeactivate(category)} className={`${listActionClass} bg-error text-white hover:bg-error/90 focus-visible:ring-error`}>Deactivate</button> : <button type="button" disabled={activateCategory.isPending} onClick={() => activate(category)} className={`${listActionClass} bg-success text-white hover:bg-success/90 focus-visible:ring-success`}>Reactivate</button>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function RoundCategoryWeightsEditor({
  pageantId,
  round,
  categories,
}: {
  pageantId: string;
  round: RoundResponse;
  categories: CategoryResponse[];
}) {
  const roundId = round.id;
  const roundName = round.name;
  const { data: configuration, isLoading, isError, save } = useRoundJudgingConfiguration(pageantId, roundId);
  const openRound = useUpdateRound(pageantId, roundId);
  const { toast } = useToast();
  const [weights, setWeights] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [openError, setOpenError] = useState<string | null>(null);

  const roundCategories = useMemo(() => {
    if (!configuration) return [];
    return configuration.categories.flatMap((item) => {
      const category = categories.find((candidate) => candidate.id === item.categoryId);
      return category ? [{ ...item, category }] : [];
    });
  }, [categories, configuration]);

  const groups = useMemo(() => [
    { key: "MEN", label: "Male", items: roundCategories.filter((item) => item.category.eligibilityScope === "MEN" || item.category.eligibilityScope === "OPEN") },
    { key: "WOMEN", label: "Female", items: roundCategories.filter((item) => ["WOMEN", "LGBTQ_PLUS", "CUSTOM", "OPEN"].includes(item.category.eligibilityScope)) },
  ].filter((group) => group.items.length > 0), [roundCategories]);
  const groupTotals = groups.map(({ items }) => items.reduce((sum, item) => sum + (Number(weights[item.categoryId] ?? item.weightPercentage) || 0), 0));
  const weightsComplete = groups.length > 0 && groupTotals.every((total) => Math.round(total * 100) === 10000);
  const criteriaComplete = roundCategories.length > 0 && roundCategories.every(({ categoryId }) => {
    const assigned = configuration?.criteria.filter((item) => item.categoryId === categoryId) ?? [];
    const total = assigned.reduce((sum, item) => sum + (Number(item.weightPercentage) || 0), 0);
    return assigned.length > 0 && Math.round(total * 100) === 10000;
  });

  async function saveWeights() {
    if (!configuration) return;
    const updated = configuration.categories.map((item) => ({ ...item, weightPercentage: weights[item.categoryId] ?? item.weightPercentage }));
    const invalid = updated.find((item) => {
      const value = Number(item.weightPercentage);
      return !Number.isFinite(value) || value < 0 || value > 100;
    });
    if (invalid) {
      setSaveError("Each category weight must be 0% or higher and no more than 100%.");
      return;
    }
    setSaveError(null);
    try {
      await save.mutateAsync({ ...configuration, categories: updated });
    } catch (error) {
      setSaveError(error instanceof ApiError ? error.userMessage : error instanceof Error ? error.message : "Could not save category weights.");
    }
  }

  async function makeRoundOpen() {
    setOpenError(null);
    try {
      if (!configuration || !weightsComplete || !criteriaComplete) return;
      const updated = configuration.categories.map((item) => ({ ...item, weightPercentage: weights[item.categoryId] ?? item.weightPercentage }));
      await save.mutateAsync({ ...configuration, categories: updated });
      await openRound.mutateAsync({
        name: round.name,
        roundNumber: round.roundNumber,
        roundType: round.roundType,
        status: "OPEN",
        advancementCount: round.advancementCount,
        startsAt: round.startsAt,
        endsAt: round.endsAt,
      });
      toast.success(`${round.name} is now open.`);
    } catch (error) {
      setOpenError(error instanceof ApiError ? error.userMessage : error instanceof Error ? error.message : "Could not open this round.");
    }
  }

  async function closeRound() {
    setOpenError(null);
    try {
      await openRound.mutateAsync({
        name: round.name,
        roundNumber: round.roundNumber,
        roundType: round.roundType,
        status: "CLOSED",
        advancementCount: round.advancementCount,
        startsAt: round.startsAt,
        endsAt: round.endsAt,
      });
      toast.success(`${round.name} is now closed.`);
    } catch (error) {
      setOpenError(error instanceof ApiError ? error.userMessage : error instanceof Error ? error.message : "Could not close this round.");
    }
  }

  if (isLoading) return <div className="mt-5 animate-pulse border border-border bg-slate/20 p-4 text-caption text-muted">Loading {roundName} judging weights…</div>;
  if (isError || !configuration) return <div className="mt-5 border border-red-200 bg-red-50 p-4 text-caption text-red-700">Could not load category weights for this round.</div>;
  if (!roundCategories.length) return null;

  return (
    <section className="mt-5 overflow-hidden rounded-lg border border-border bg-white" aria-label={`${roundName} category weights`}>
      <div className="flex flex-col gap-3 border-b border-border bg-slate/20 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div>
          <h5 className="text-small font-semibold text-charcoal">Category weights <span className="font-normal text-muted">· {roundName}</span></h5>
          <p className="mt-1 max-w-2xl text-caption leading-relaxed text-muted">Set each group to 100% independently. Example: Best in Barong 50% + Production Number 50%. Female categories have their own 100% total. Each category’s criteria also need 100 points.</p>
        </div>
        <button type="button" onClick={saveWeights} disabled={save.isPending} className="inline-flex min-h-10 shrink-0 items-center justify-center rounded bg-navy px-4 py-2 text-caption font-semibold text-white transition hover:bg-navy/90 disabled:opacity-50">{save.isPending ? "Saving…" : "Save weights"}</button>
      </div>
      {!weightsComplete ? <div role="status" className="mx-4 mt-4 flex items-start gap-3 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 sm:mx-5"><span aria-hidden="true" className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">!</span><div><p className="text-small font-semibold text-amber-950">Set the category weights before opening this round</p><p className="mt-0.5 text-caption leading-relaxed text-amber-900">Enter a weight for every category. Male and Female totals are separate; each group must add up to exactly 100%.</p></div></div> : null}
      <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-2">
        {groups.map(({ key, label, items }) => {
          const total = items.reduce((sum, item) => sum + (Number(weights[item.categoryId] ?? item.weightPercentage) || 0), 0);
          const totalBasisPoints = Math.round(total * 100);
          const complete = totalBasisPoints === 10000;
          const progress = Math.min(total, 100);
          return <div key={key} className="overflow-hidden rounded-lg border border-border">
            <div className="flex items-center justify-between gap-3 bg-navy/[0.035] px-4 py-3">
              <h6 className="text-small font-semibold text-charcoal">{label} categories</h6>
              <span className={`shrink-0 text-small font-bold tabular-nums ${complete ? "text-green-700" : total > 100 ? "text-red-700" : "text-amber-700"}`}>{total.toFixed(2)} <span className="font-medium text-muted">/ 100%</span></span>
            </div>
            <div className="divide-y divide-border/70 px-4">
              {items.map(({ category, categoryId, weightPercentage }) => <label key={categoryId} className="flex min-h-12 items-center justify-between gap-3 py-2">
                <span className="min-w-0 break-words text-small text-charcoal">{category.name}{category.eligibilityScope === "OPEN" ? <span className="ml-2 rounded bg-slate/50 px-1.5 py-0.5 text-[10px] font-medium text-muted">Open to all · shared</span> : category.eligibilityScope === "LGBTQ_PLUS" ? <span className="ml-2 rounded bg-slate/50 px-1.5 py-0.5 text-[10px] font-medium text-muted">LGBTQ+</span> : category.eligibilityScope === "CUSTOM" ? <span className="ml-2 rounded bg-slate/50 px-1.5 py-0.5 text-[10px] font-medium text-muted">Other eligibility</span> : null}</span>
                <span className="flex shrink-0 items-center gap-1.5"><input type="number" min="0" max="100" step="0.01" value={weights[categoryId] ?? weightPercentage} onChange={(event) => setWeights((current) => ({ ...current, [categoryId]: event.target.value }))} aria-label={`${category.name} category weight percentage`} className="h-9 w-24 rounded border border-border bg-white px-2.5 text-right text-small tabular-nums text-charcoal focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/15" /><span className="text-caption text-muted">%</span></span>
              </label>)}
            </div>
            <div className="h-1 overflow-hidden bg-slate"><div className={`h-full transition-[width] ${complete ? "bg-green-500" : total > 100 ? "bg-red-500" : "bg-gold"}`} style={{ width: `${progress}%` }} /></div>
            <p className={`px-4 py-2 text-caption ${complete ? "bg-green-50/70 text-green-700" : total > 100 ? "bg-red-50 text-red-700" : "text-muted"}`}>{complete ? "Ready" : total > 100 ? `Reduce by ${(total - 100).toFixed(2)}%` : `Add ${(100 - total).toFixed(2)}%`}</p>
          </div>;
        })}
      </div>
      <div className="mx-4 mb-4 flex flex-col gap-3 rounded-md border border-border bg-slate/20 p-4 sm:mx-5 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="text-small font-semibold text-charcoal">Round status: {round.status === "OPEN" ? "Open" : round.status === "DRAFT" ? "Draft" : round.status}</p><p className="mt-0.5 text-caption text-muted">{!weightsComplete ? "Complete both gender weight totals to enable opening." : !criteriaComplete ? "Add criteria totaling 100 points for every category to enable opening." : round.status === "OPEN" ? "Judges can now score this round." : "Weights and criteria are ready. You can open this round."}</p></div>
        {round.status === "OPEN" ? <div className="flex flex-wrap items-center gap-2"><span className="inline-flex min-h-10 items-center justify-center rounded bg-green-100 px-4 py-2 text-caption font-semibold text-green-800">Round is open</span><button type="button" onClick={closeRound} disabled={openRound.isPending} className="inline-flex min-h-10 shrink-0 items-center justify-center rounded bg-error px-4 py-2 text-caption font-semibold text-white transition hover:bg-error/90 disabled:cursor-not-allowed disabled:opacity-50">{openRound.isPending ? "Closing…" : "Close this round"}</button></div> : round.status === "DRAFT" ? <button type="button" onClick={makeRoundOpen} disabled={!weightsComplete || !criteriaComplete || save.isPending || openRound.isPending} title={!weightsComplete ? "Male and Female category weights must each total 100%." : !criteriaComplete ? "Each category needs criteria totaling 100 points." : undefined} className="inline-flex min-h-10 shrink-0 items-center justify-center rounded bg-gold px-4 py-2 text-caption font-semibold text-navy transition hover:bg-gold/80 disabled:cursor-not-allowed disabled:opacity-45">{openRound.isPending || save.isPending ? "Opening…" : "Make this round open"}</button> : <span className="inline-flex min-h-10 items-center justify-center rounded bg-slate/50 px-4 py-2 text-caption font-semibold text-muted">Round {round.status.toLowerCase()}</span>}
      </div>
      {openError ? <p role="alert" className="mx-4 mb-4 rounded border border-red-200 bg-red-50 px-3 py-2.5 text-caption text-red-700 sm:mx-5">{openError}</p> : null}
      {saveError ? <p role="alert" className="mx-4 mb-4 rounded border border-red-200 bg-red-50 px-3 py-2.5 text-caption text-red-700 sm:mx-5">{saveError}</p> : null}
    </section>
  );
}
