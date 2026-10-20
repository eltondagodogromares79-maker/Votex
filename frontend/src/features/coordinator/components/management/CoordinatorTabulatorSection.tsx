"use client";

import { useState } from "react";
import { useTabulators } from "@/src/features/coordinator/hooks/useStaff";
import AddTabulatorModal from "../modals/AddTabulator";
import CoordinatorStaffActions from "./CoordinatorStaffActions";
import { usePageantResourceLimits } from "@/src/features/coordinator/hooks/usePageants";

type TabulatorSectionProps = {
  pageantId: string;
};


function TabulatorsLoading() {
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

export default function TabulatorSection({
  pageantId,
}: TabulatorSectionProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { data: limits } = usePageantResourceLimits(pageantId);

  const {
    data: tabulators,
    isLoading,
    isError,
    error,
  } = useTabulators(pageantId);

  if (isLoading) {
    return (
      <div className="bg-surface border border-border p-5">
        <div>
          <h4 className="font-serif font-semibold text-charcoal text-h3">
            Tabulators
          </h4>

          <p className="text-small text-muted mt-1">
            Manage the tabulators for this pageant.
          </p>
        </div>

        <TabulatorsLoading />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-surface border border-border p-5">
        <h4 className="font-serif font-semibold text-charcoal text-h3">
          Tabulators
        </h4>

        <p className="text-small text-muted mt-1">
          Manage the tabulators for this pageant.
        </p>

        <div className="mt-6 border border-red-200 bg-red-50 p-5">
          <p className="text-small font-semibold text-red-700">
            Unable to load tabulators
          </p>

          <p className="text-caption text-red-600 mt-1">
            {error instanceof Error
              ? error.message
              : "Something went wrong while loading the tabulators."}
          </p>
        </div>
      </div>
    );
  }

  const tabulatorList = tabulators ?? [];
  const canAddTabulator = !!limits?.hasActiveSubscription && (limits.maxTabulatorUsers === null || limits.tabulatorsUsed < limits.maxTabulatorUsers);
  const tabulatorLimitLabel = !limits?.hasActiveSubscription
    ? "An active subscription is required to assign tabulators."
    : `${limits.tabulatorsUsed} / ${limits.maxTabulatorUsers ?? "∞"} organization tabulator slots used.`;

  return (
    <>
      <div className="bg-surface border border-border p-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h4 className="font-serif font-semibold text-charcoal text-h3">
              Tabulators
            </h4>

          <p className="text-small text-muted mt-1">
            Manage the tabulators for this pageant. {tabulatorLimitLabel}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            disabled={!canAddTabulator}
            className="self-start bg-gold px-4 py-2.5 text-small font-semibold text-navy transition-colors hover:bg-gold/60 hover:text-navy focus:outline-none focus:ring-2 focus:ring-navy focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            + Add Tabulator
          </button>
        </div>

        {/* Tabulator count */}
        <div className="mt-5 flex items-center gap-2">
          <span className="text-small font-semibold text-charcoal">
            {tabulatorList.length}
          </span>

          <span className="text-small text-muted">
            {tabulatorList.length === 1 ? "tabulator" : "tabulators"}
          </span>
        </div>

        {/* Empty state */}
        {tabulatorList.length === 0 ? (
          <div className="mt-5 border border-dashed border-border px-6 py-12 text-center">
            <div className="mx-auto w-12 h-12 flex items-center justify-center bg-slate/50 text-navy">
              <span className="text-xl font-serif font-bold">T</span>
            </div>

            <h5 className="mt-4 text-small font-semibold text-charcoal">
              No tabulators yet
            </h5>

            <p className="mt-1 text-caption text-muted max-w-sm mx-auto">
              Add tabulators so they can tabulate scores for this pageant.
            </p>

            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              disabled={!canAddTabulator}
              className="mt-4 text-small font-semibold text-navy hover:underline disabled:cursor-not-allowed disabled:opacity-50"
            >
              Add your first tabulator
            </button>
          </div>
        ) : (
          /* Tabulator table */
          <div className="mt-5 border border-border overflow-hidden">
            {/* Desktop header */}
            <div className="hidden md:grid md:grid-cols-[minmax(0,1fr)_120px_100px] gap-4 px-5 py-3 bg-slate/30 border-b border-border">
              <p className="text-caption font-semibold text-muted uppercase tracking-wide">
                Tabulator
              </p>

              <p className="text-caption font-semibold text-muted uppercase tracking-wide">
                Status
              </p>

              <p className="text-caption font-semibold text-muted uppercase tracking-wide text-right">
                Actions
              </p>
            </div>

            <div className="divide-y divide-border">
              {tabulatorList.map((tabulator) => (
                <div
                  key={tabulator.userId}
                  className="px-5 py-4 transition-colors hover:bg-slate/10"
                >
                  {/* Desktop */}
                  <div className="hidden md:grid md:grid-cols-[minmax(0,1fr)_120px_100px] gap-4 items-center">
                    {/* Tabulator */}
                    <div className="flex items-center gap-3 min-w-0">
                      <TabulatorAvatar firstName={tabulator.firstName} />

                      <div className="min-w-0">
                        <p className="text-small font-semibold text-charcoal break-words [overflow-wrap:anywhere]">
                          {tabulator.firstName} {tabulator.lastName}
                        </p>

                        <p className="text-caption text-muted break-words [overflow-wrap:anywhere]">
                          {tabulator.email}
                        </p>
                      </div>
                    </div>

                    {/* Status */}
                    <div>
                      <TabulatorStatus isActive={tabulator.isActive} />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3">
                      <CoordinatorStaffActions pageantId={pageantId} staff={tabulator} role="tabulator" />
                    </div>
                  </div>

                  {/* Mobile */}
                  <div className="md:hidden">
                    <div className="flex items-start gap-3">
                      <TabulatorAvatar firstName={tabulator.firstName} />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-small font-semibold text-charcoal break-words [overflow-wrap:anywhere]">
                              {tabulator.firstName} {tabulator.lastName}
                            </p>

                            <p className="text-caption text-muted mt-0.5 break-words [overflow-wrap:anywhere]">
                              {tabulator.email}
                            </p>
                          </div>

                          <TabulatorStatus isActive={tabulator.isActive} />
                        </div>

                        <div className="flex items-center mt-3">
                          <div className="ml-auto flex items-center gap-3">
                            <CoordinatorStaffActions pageantId={pageantId} staff={tabulator} role="tabulator" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Tabulator Modal */}
      <AddTabulatorModal
        pageantId={pageantId}
        open={isAddModalOpen}
        canAdd={canAddTabulator}
        limitMessage={tabulatorLimitLabel}
        onClose={() => setIsAddModalOpen(false)}
      />

    </>
  );
}

function TabulatorAvatar({ firstName }: { firstName: string }) {
  return (
    <div
      className="w-11 h-11 shrink-0 rounded-full border border-border bg-slate/50 flex items-center justify-center text-navy"
      aria-label={`${firstName} has no photo`}
    >
      <span className="text-small font-semibold">
        {firstName.charAt(0).toUpperCase()}
      </span>
    </div>
  );
}

function TabulatorStatus({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 text-[11px] font-semibold ${
        isActive
          ? "bg-green-50 text-green-700 border border-green-200"
          : "bg-slate/50 text-muted border border-border"
      }`}
    >
      {isActive ? "Active" : "Deactivated"}
    </span>
  );
}
