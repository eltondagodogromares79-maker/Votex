"use client";

import { useState } from "react";
import { useCategories, useCriteria } from "@/src/features/coordinator/hooks/useCategories";
import AddCategoryModal from "../modals/AddCategory";
import EditCategoryModal from "../modals/EditCategory";
import DeactivateCategoryModal from "../modals/DeactivateCategory";
import AddCriterionModal from "../modals/AddCriterion";
import EditCriterionModal from "../modals/EditCriterion";
import DeactivateCriterionModal from "../modals/DeactivateCriterion";
import type { CategoryResponse, CriterionResponse } from "@/src/types";

type CategoriesSectionProps = {
  pageantId: string;
};

type SubTab = "categories" | "criteria";

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

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 text-[11px] font-semibold ${
        isActive
          ? "bg-green-50 text-green-700 border border-green-200"
          : "bg-slate/50 text-muted border border-border"
      }`}
    >
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

export default function CategoriesSection({
  pageantId,
}: CategoriesSectionProps) {
  const [activeTab, setActiveTab] = useState<SubTab>("categories");

  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [editCategoryTarget, setEditCategoryTarget] = useState<CategoryResponse | null>(null);
  const [deactivateCategoryTarget, setDeactivateCategoryTarget] = useState<CategoryResponse | null>(null);

  const [isAddCriterionOpen, setIsAddCriterionOpen] = useState(false);
  const [editCriterionTarget, setEditCriterionTarget] = useState<CriterionResponse | null>(null);
  const [deactivateCriterionTarget, setDeactivateCriterionTarget] = useState<CriterionResponse | null>(null);

  return (
    <>
      <div className="bg-surface border border-border p-5">
        <div>
          <h4 className="font-serif font-semibold text-charcoal text-h3">
            Categories & Criteria
          </h4>

          <p className="text-small text-muted mt-1">
            Manage the judging categories and criteria for this pageant.
          </p>
        </div>

        {/* Sub-tab switcher */}
        <div className="mt-5 flex items-center gap-5 border-b border-border">
          <button
            type="button"
            onClick={() => setActiveTab("categories")}
            className={`pb-2.5 text-small font-semibold border-b-2 transition-colors ${
              activeTab === "categories"
                ? "border-navy text-navy"
                : "border-transparent text-muted hover:text-charcoal"
            }`}
          >
            Categories
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("criteria")}
            className={`pb-2.5 text-small font-semibold border-b-2 transition-colors ${
              activeTab === "criteria"
                ? "border-navy text-navy"
                : "border-transparent text-muted hover:text-charcoal"
            }`}
          >
            Criteria
          </button>
        </div>

        {activeTab === "categories" ? (
          <CategoriesList
            pageantId={pageantId}
            onAdd={() => setIsAddCategoryOpen(true)}
            onEdit={setEditCategoryTarget}
            onDeactivate={setDeactivateCategoryTarget}
          />
        ) : (
          <CriteriaList
            pageantId={pageantId}
            onAdd={() => setIsAddCriterionOpen(true)}
            onEdit={setEditCriterionTarget}
            onDeactivate={setDeactivateCriterionTarget}
          />
        )}
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

      {/* Criterion modals */}
      <AddCriterionModal
        pageantId={pageantId}
        open={isAddCriterionOpen}
        onClose={() => setIsAddCriterionOpen(false)}
      />
      <EditCriterionModal
        pageantId={pageantId}
        criterion={editCriterionTarget}
        onClose={() => setEditCriterionTarget(null)}
      />
      <DeactivateCriterionModal
        pageantId={pageantId}
        criterion={deactivateCriterionTarget}
        onClose={() => setDeactivateCriterionTarget(null)}
      />
    </>
  );
}

function CategoriesList({
  pageantId,
  onAdd,
  onEdit,
  onDeactivate,
}: {
  pageantId: string;
  onAdd: () => void;
  onEdit: (category: CategoryResponse) => void;
  onDeactivate: (category: CategoryResponse) => void;
}) {
  const { data: categories, isLoading, isError, error } = useCategories(pageantId);

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

  return (
    <div className="mt-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-small font-semibold text-charcoal">
            {categoryList.length}
          </span>

          <span className="text-small text-muted">
            {categoryList.length === 1 ? "category" : "categories"}
          </span>
        </div>

        <button
          type="button"
          onClick={onAdd}
          className="self-start bg-gold px-4 py-2.5 text-small font-semibold text-navy transition-colors hover:bg-gold/60 hover:text-navy focus:outline-none focus:ring-2 focus:ring-navy focus:ring-offset-2"
        >
          + Add Category
        </button>
      </div>

      {categoryList.length === 0 ? (
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
            className="mt-4 text-small font-semibold text-navy hover:underline"
          >
            Add your first category
          </button>
        </div>
      ) : (
        <div className="mt-5 border border-border overflow-hidden">
          <div className="hidden md:grid md:grid-cols-[120px_minmax(0,1fr)_120px_120px_100px] gap-4 px-5 py-3 bg-slate/30 border-b border-border">
            <p className="text-caption font-semibold text-muted uppercase tracking-wide">
              Code
            </p>
            <p className="text-caption font-semibold text-muted uppercase tracking-wide">
              Name
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
            {categoryList.map((category) => (
              <div
                key={category.id}
                className="px-5 py-4 transition-colors hover:bg-slate/10"
              >
                {/* Desktop */}
                <div className="hidden md:grid md:grid-cols-[120px_minmax(0,1fr)_120px_120px_100px] gap-4 items-center">
                  <div>
                    <span className="text-small font-semibold text-navy">
                      {category.code}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <p className="text-small font-semibold text-charcoal truncate">
                      {category.name}
                    </p>
                  </div>

                  <div>
                    <p className="text-small text-charcoal">
                      {category.displayOrder}
                    </p>
                  </div>

                  <div>
                    <StatusBadge isActive={category.isActive} />
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => onEdit(category)}
                      className="text-caption font-semibold text-navy hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeactivate(category)}
                      className="text-caption font-semibold text-red-600 hover:underline"
                    >
                      Deactivate
                    </button>
                  </div>
                </div>

                {/* Mobile */}
                <div className="md:hidden">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-small font-semibold text-charcoal truncate">
                        {category.name}
                      </p>

                      <p className="text-caption text-muted mt-0.5">
                        {category.code}
                      </p>
                    </div>

                    <StatusBadge isActive={category.isActive} />
                  </div>

                  <div className="flex items-center gap-4 mt-3">
                    <div>
                      <p className="text-[11px] text-muted uppercase tracking-wide">
                        Display Order
                      </p>

                      <p className="text-caption text-charcoal mt-0.5">
                        {category.displayOrder}
                      </p>
                    </div>

                    <div className="ml-auto flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => onEdit(category)}
                        className="text-caption font-semibold text-navy hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeactivate(category)}
                        className="text-caption font-semibold text-red-600 hover:underline"
                      >
                        Deactivate
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CriteriaList({
  pageantId,
  onAdd,
  onEdit,
  onDeactivate,
}: {
  pageantId: string;
  onAdd: () => void;
  onEdit: (criterion: CriterionResponse) => void;
  onDeactivate: (criterion: CriterionResponse) => void;
}) {
  const { data: criteria, isLoading, isError, error } = useCriteria(pageantId);

  if (isLoading) {
    return <ListLoading />;
  }

  if (isError) {
    return (
      <div className="mt-6 border border-red-200 bg-red-50 p-5">
        <p className="text-small font-semibold text-red-700">
          Unable to load criteria
        </p>

        <p className="text-caption text-red-600 mt-1">
          {error instanceof Error
            ? error.message
            : "Something went wrong while loading the criteria."}
        </p>
      </div>
    );
  }

  const criterionList = criteria ?? [];

  return (
    <div className="mt-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-small font-semibold text-charcoal">
            {criterionList.length}
          </span>

          <span className="text-small text-muted">
            {criterionList.length === 1 ? "criterion" : "criteria"}
          </span>
        </div>

        <button
          type="button"
          onClick={onAdd}
          className="self-start bg-gold px-4 py-2.5 text-small font-semibold text-navy transition-colors hover:bg-gold/60 hover:text-navy focus:outline-none focus:ring-2 focus:ring-navy focus:ring-offset-2"
        >
          + Add Criterion
        </button>
      </div>

      {criterionList.length === 0 ? (
        <div className="mt-5 border border-dashed border-border px-6 py-12 text-center">
          <div className="mx-auto w-12 h-12 flex items-center justify-center bg-slate/50 text-navy">
            <span className="text-xl font-serif font-bold">C</span>
          </div>

          <h5 className="mt-4 text-small font-semibold text-charcoal">
            No criteria yet
          </h5>

          <p className="mt-1 text-caption text-muted max-w-sm mx-auto">
            Add criteria to define how judges score candidates in this pageant.
          </p>

          <button
            type="button"
            onClick={onAdd}
            className="mt-4 text-small font-semibold text-navy hover:underline"
          >
            Add your first criterion
          </button>
        </div>
      ) : (
        <div className="mt-5 border border-border overflow-hidden">
          <div className="hidden md:grid md:grid-cols-[120px_minmax(0,1fr)_100px_100px_120px_100px] gap-4 px-5 py-3 bg-slate/30 border-b border-border">
            <p className="text-caption font-semibold text-muted uppercase tracking-wide">
              Code
            </p>
            <p className="text-caption font-semibold text-muted uppercase tracking-wide">
              Name
            </p>
            <p className="text-caption font-semibold text-muted uppercase tracking-wide">
              Min Score
            </p>
            <p className="text-caption font-semibold text-muted uppercase tracking-wide">
              Max Score
            </p>
            <p className="text-caption font-semibold text-muted uppercase tracking-wide">
              Status
            </p>
            <p className="text-caption font-semibold text-muted uppercase tracking-wide text-right">
              Actions
            </p>
          </div>

          <div className="divide-y divide-border">
            {criterionList.map((criterion) => (
              <div
                key={criterion.id}
                className="px-5 py-4 transition-colors hover:bg-slate/10"
              >
                {/* Desktop */}
                <div className="hidden md:grid md:grid-cols-[120px_minmax(0,1fr)_100px_100px_120px_100px] gap-4 items-center">
                  <div>
                    <span className="text-small font-semibold text-navy">
                      {criterion.code}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <p className="text-small font-semibold text-charcoal truncate">
                      {criterion.name}
                    </p>
                  </div>

                  <div>
                    <p className="text-small text-charcoal">
                      {criterion.defaultMinimumScore}
                    </p>
                  </div>

                  <div>
                    <p className="text-small text-charcoal">
                      {criterion.defaultMaximumScore}
                    </p>
                  </div>

                  <div>
                    <StatusBadge isActive={criterion.isActive} />
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => onEdit(criterion)}
                      className="text-caption font-semibold text-navy hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeactivate(criterion)}
                      className="text-caption font-semibold text-red-600 hover:underline"
                    >
                      Deactivate
                    </button>
                  </div>
                </div>

                {/* Mobile */}
                <div className="md:hidden">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-small font-semibold text-charcoal truncate">
                        {criterion.name}
                      </p>

                      <p className="text-caption text-muted mt-0.5">
                        {criterion.code}
                      </p>
                    </div>

                    <StatusBadge isActive={criterion.isActive} />
                  </div>

                  <div className="flex items-center gap-4 mt-3">
                    <div>
                      <p className="text-[11px] text-muted uppercase tracking-wide">
                        Min Score
                      </p>

                      <p className="text-caption text-charcoal mt-0.5">
                        {criterion.defaultMinimumScore}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] text-muted uppercase tracking-wide">
                        Max Score
                      </p>

                      <p className="text-caption text-charcoal mt-0.5">
                        {criterion.defaultMaximumScore}
                      </p>
                    </div>

                    <div className="ml-auto flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => onEdit(criterion)}
                        className="text-caption font-semibold text-navy hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeactivate(criterion)}
                        className="text-caption font-semibold text-red-600 hover:underline"
                      >
                        Deactivate
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
