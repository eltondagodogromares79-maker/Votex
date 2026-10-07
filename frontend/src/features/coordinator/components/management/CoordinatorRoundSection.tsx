"use client";

import { useState } from "react";
import { useRounds } from "@/src/features/coordinator/hooks/useRounds";
import AddRoundModal from "../modals/AddRound";
import EditRoundModal from "../modals/EditRound";
import DeleteRoundModal from "../modals/DeleteRound";
import type { RoundResponse, RoundStatus } from "@/src/types";

type RoundSectionProps = {
  pageantId: string;
};

const ROUND_TYPE_LABELS: Record<string, string> = {
  PRELIMINARY: "Preliminary",
  SWIMWEAR: "Swimwear",
  FORMAL_WEAR: "Formal Wear",
  TALENT: "Talent",
  QUESTION_AND_ANSWER: "Question & Answer",
  FINAL: "Final",
  CUSTOM: "Custom",
};

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatScheduled(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return dateTimeFormatter.format(date);
}

function RoundsLoading() {
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

export default function RoundSection({
  pageantId,
}: RoundSectionProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<RoundResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RoundResponse | null>(null);

  const {
    data: rounds,
    isLoading,
    isError,
    error,
  } = useRounds(pageantId);

  if (isLoading) {
    return (
      <div className="bg-surface border border-border p-5">
        <div>
          <h4 className="font-serif font-semibold text-charcoal text-h3">
            Rounds
          </h4>

          <p className="text-small text-muted mt-1">
            Manage the rounds for this pageant.
          </p>
        </div>

        <RoundsLoading />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-surface border border-border p-5">
        <h4 className="font-serif font-semibold text-charcoal text-h3">
          Rounds
        </h4>

        <p className="text-small text-muted mt-1">
          Manage the rounds for this pageant.
        </p>

        <div className="mt-6 border border-red-200 bg-red-50 p-5">
          <p className="text-small font-semibold text-red-700">
            Unable to load rounds
          </p>

          <p className="text-caption text-red-600 mt-1">
            {error instanceof Error
              ? error.message
              : "Something went wrong while loading the rounds."}
          </p>
        </div>
      </div>
    );
  }

  const roundList = rounds ?? [];

  return (
    <>
      <div className="bg-surface border border-border p-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h4 className="font-serif font-semibold text-charcoal text-h3">
              Rounds
            </h4>

            <p className="text-small text-muted mt-1">
              Manage the rounds for this pageant.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="self-start bg-gold px-4 py-2.5 text-small font-semibold text-navy transition-colors hover:bg-gold/60 hover:text-navy focus:outline-none focus:ring-2 focus:ring-navy focus:ring-offset-2"
          >
            + Add Round
          </button>
        </div>

        {/* Round count */}
        <div className="mt-5 flex items-center gap-2">
          <span className="text-small font-semibold text-charcoal">
            {roundList.length}
          </span>

          <span className="text-small text-muted">
            {roundList.length === 1 ? "round" : "rounds"}
          </span>
        </div>

        {/* Empty state */}
        {roundList.length === 0 ? (
          <div className="mt-5 border border-dashed border-border px-6 py-12 text-center">
            <div className="mx-auto w-12 h-12 flex items-center justify-center bg-slate/50 text-navy">
              <span className="text-xl font-serif font-bold">R</span>
            </div>

            <h5 className="mt-4 text-small font-semibold text-charcoal">
              No rounds yet
            </h5>

            <p className="mt-1 text-caption text-muted max-w-sm mx-auto">
              Add rounds to structure how this pageant progresses.
            </p>

            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="mt-4 text-small font-semibold text-navy hover:underline"
            >
              Add your first round
            </button>
          </div>
        ) : (
          /* Round table */
          <div className="mt-5 border border-border overflow-hidden">
            {/* Desktop header */}
            <div className="hidden md:grid md:grid-cols-[80px_minmax(0,1fr)_140px_110px_1fr_110px] gap-4 px-5 py-3 bg-slate/30 border-b border-border">
              <p className="text-caption font-semibold text-muted uppercase tracking-wide">
                No.
              </p>

              <p className="text-caption font-semibold text-muted uppercase tracking-wide">
                Name
              </p>

              <p className="text-caption font-semibold text-muted uppercase tracking-wide">
                Type
              </p>

              <p className="text-caption font-semibold text-muted uppercase tracking-wide">
                Status
              </p>

              <p className="text-caption font-semibold text-muted uppercase tracking-wide">
                Starts / Ends
              </p>

              <p className="text-caption font-semibold text-muted uppercase tracking-wide text-right">
                Actions
              </p>
            </div>

            <div className="divide-y divide-border">
              {roundList.map((round) => (
                <div
                  key={round.id}
                  className="px-5 py-4 transition-colors hover:bg-slate/10"
                >
                  {/* Desktop */}
                  <div className="hidden md:grid md:grid-cols-[80px_minmax(0,1fr)_140px_110px_1fr_110px] gap-4 items-center">
                    {/* Round number */}
                    <div>
                      <span className="text-small font-semibold text-navy">
                        #{round.roundNumber}
                      </span>
                    </div>

                    {/* Name */}
                    <div className="min-w-0">
                      <p className="text-small font-semibold text-charcoal truncate">
                        {round.name}
                      </p>
                    </div>

                    {/* Type */}
                    <div>
                      <p className="text-small text-charcoal">
                        {ROUND_TYPE_LABELS[round.roundType] ?? round.roundType}
                      </p>
                    </div>

                    {/* Status */}
                    <div>
                      <RoundStatusBadge status={round.status} />
                    </div>

                    {/* Starts / Ends */}
                    <div>
                      <p className="text-caption text-charcoal">
                        {formatScheduled(round.startsAt)}
                      </p>
                      <p className="text-caption text-muted">
                        {formatScheduled(round.endsAt)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setEditTarget(round)}
                        className="text-caption font-semibold text-navy hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(round)}
                        className="text-caption font-semibold text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Mobile */}
                  <div className="md:hidden">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-small font-semibold text-charcoal truncate">
                          {round.name}
                        </p>

                        <p className="text-caption text-muted mt-0.5">
                          Round #{round.roundNumber} · {ROUND_TYPE_LABELS[round.roundType] ?? round.roundType}
                        </p>
                      </div>

                      <RoundStatusBadge status={round.status} />
                    </div>

                    <div className="flex items-center gap-4 mt-3">
                      <div>
                        <p className="text-[11px] text-muted uppercase tracking-wide">
                          Starts / Ends
                        </p>

                        <p className="text-caption text-charcoal mt-0.5">
                          {formatScheduled(round.startsAt)}
                        </p>
                        <p className="text-caption text-muted">
                          {formatScheduled(round.endsAt)}
                        </p>
                      </div>

                      <div className="ml-auto flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setEditTarget(round)}
                          className="text-caption font-semibold text-navy hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(round)}
                          className="text-caption font-semibold text-red-600 hover:underline"
                        >
                          Delete
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

      {/* Add Round Modal */}
      <AddRoundModal
        pageantId={pageantId}
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      {/* Edit Round Modal */}
      <EditRoundModal
        pageantId={pageantId}
        round={editTarget}
        onClose={() => setEditTarget(null)}
      />

      {/* Delete Round Confirmation */}
      <DeleteRoundModal
        pageantId={pageantId}
        round={deleteTarget}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  );
}

function RoundStatusBadge({ status }: { status: RoundStatus }) {
  const VARIANTS: Record<RoundStatus, string> = {
    DRAFT: "bg-slate/50 text-muted border border-border",
    OPEN: "bg-green-50 text-green-700 border border-green-200",
    CLOSED: "bg-navy/10 text-navy border border-navy/20",
    FINALIZED: "bg-gold/10 text-navy border border-gold/40",
  };

  const LABELS: Record<RoundStatus, string> = {
    DRAFT: "Draft",
    OPEN: "Open",
    CLOSED: "Closed",
    FINALIZED: "Finalized",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 text-[11px] font-semibold ${VARIANTS[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}
