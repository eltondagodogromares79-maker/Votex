"use client";

import { useState } from "react";
import Image from "next/image";
import { useContestants } from "@/src/features/coordinator/hooks/useContestants";
import AddCandidateModal from "../modals/AddCandidates";
import EditCandidateModal from "../modals/EditCandidate";
import DeactivateCandidateModal from "../modals/DeactivateCandidate";
import type { CandidateResponse } from "@/src/types";


type CandidatesSectionProps = {
  pageantId: string;
};

function CandidatesLoading() {
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

export default function CandidatesSection({
  pageantId,
}: CandidatesSectionProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CandidateResponse | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<CandidateResponse | null>(null);

  const {
    data: candidates,
    isLoading,
    isError,
    error,
  } = useContestants(pageantId);

  if (isLoading) {
    return (
      <div className="bg-surface border border-border p-5">
        <div>
          <h4 className="font-serif font-semibold text-charcoal text-h3">
            Candidates
          </h4>

          <p className="text-small text-muted mt-1">
            Manage the candidates for this pageant.
          </p>
        </div>

        <CandidatesLoading />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-surface border border-border p-5">
        <h4 className="font-serif font-semibold text-charcoal text-h3">
          Candidates
        </h4>

        <p className="text-small text-muted mt-1">
          Manage the candidates for this pageant.
        </p>

        <div className="mt-6 border border-red-200 bg-red-50 p-5">
          <p className="text-small font-semibold text-red-700">
            Unable to load candidates
          </p>

          <p className="text-caption text-red-600 mt-1">
            {error instanceof Error
              ? error.message
              : "Something went wrong while loading the candidates."}
          </p>
        </div>
      </div>
    );
  }

  const candidateList = candidates ?? [];

  return (
    <>
      <div className="bg-surface border border-border p-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h4 className="font-serif font-semibold text-charcoal text-h3">
              Candidates
            </h4>

            <p className="text-small text-muted mt-1">
              Manage the candidates for this pageant.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="self-start bg-gold px-4 py-2.5 text-small font-semibold text-navy transition-colors hover:bg-gold/60 hover:text-navy focus:outline-none focus:ring-2 focus:ring-navy focus:ring-offset-2"
          >
            + Add Candidate
          </button>
        </div>

        {/* Candidate count */}
        <div className="mt-5 flex items-center gap-2">
          <span className="text-small font-semibold text-charcoal">
            {candidateList.length}
          </span>

          <span className="text-small text-muted">
            {candidateList.length === 1 ? "candidate" : "candidates"}
          </span>
        </div>

        {/* Empty state */}
        {candidateList.length === 0 ? (
          <div className="mt-5 border border-dashed border-border px-6 py-12 text-center">
            <div className="mx-auto w-12 h-12 flex items-center justify-center bg-slate/50 text-navy">
              <span className="text-xl font-serif font-bold">C</span>
            </div>

            <h5 className="mt-4 text-small font-semibold text-charcoal">
              No candidates yet
            </h5>

            <p className="mt-1 text-caption text-muted max-w-sm mx-auto">
              Add candidates to start building the contestant list for this
              pageant.
            </p>

            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="mt-4 text-small font-semibold text-navy hover:underline"
            >
              Add your first candidate
            </button>
          </div>
        ) : (
          /* Candidate table */
          <div className="mt-5 border border-border overflow-hidden">
            {/* Desktop header */}
            <div className="hidden md:grid md:grid-cols-[80px_minmax(0,1fr)_120px_120px_100px] gap-4 px-5 py-3 bg-slate/30 border-b border-border">
              <p className="text-caption font-semibold text-muted uppercase tracking-wide">
                No.
              </p>

              <p className="text-caption font-semibold text-muted uppercase tracking-wide">
                Candidate
              </p>

              <p className="text-caption font-semibold text-muted uppercase tracking-wide">
                Gender
              </p>

              <p className="text-caption font-semibold text-muted uppercase tracking-wide">
                Status
              </p>

              <p className="text-caption font-semibold text-muted uppercase tracking-wide text-right">
                Actions
              </p>
            </div>

            <div className="divide-y divide-border">
              {candidateList.map((candidate) => (
                <div
                  key={candidate.id}
                  className="px-5 py-4 transition-colors hover:bg-slate/10"
                >
                  {/* Desktop */}
                  <div className="hidden md:grid md:grid-cols-[80px_minmax(0,1fr)_120px_120px_100px] gap-4 items-center">
                    {/* Contestant number */}
                    <div>
                      <span className="text-small font-semibold text-navy">
                        #{candidate.contestantNumber}
                      </span>
                    </div>

                    {/* Candidate */}
                    <div className="flex items-center gap-3 min-w-0">
                      <CandidateAvatar
                        photoUrl={candidate.photoUrl}
                        displayName={candidate.displayName}
                      />

                      <div className="min-w-0">
                        <p className="text-small font-semibold text-charcoal truncate">
                          {candidate.displayName}
                        </p>

                        <p className="text-caption text-muted truncate">
                          {candidate.firstName} {candidate.lastName}
                        </p>
                      </div>
                    </div>

                    {/* Gender */}
                    <div>
                      <p className="text-small text-charcoal">
                        {candidate.gender ?? "—"}
                      </p>
                    </div>

                    {/* Status */}
                    <div>
                      <CandidateStatus isActive={candidate.isActive} />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setEditTarget(candidate)}
                        className="text-caption font-semibold text-navy hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeactivateTarget(candidate)}
                        className="text-caption font-semibold text-red-600 hover:underline"
                      >
                        Deactivate
                      </button>
                    </div>
                  </div>

                  {/* Mobile */}
                  <div className="md:hidden">
                    <div className="flex items-start gap-3">
                      <CandidateAvatar
                        photoUrl={candidate.photoUrl}
                        displayName={candidate.displayName}
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-small font-semibold text-charcoal truncate">
                              {candidate.displayName}
                            </p>

                            <p className="text-caption text-muted mt-0.5">
                              Candidate #{candidate.contestantNumber}
                            </p>
                          </div>

                          <CandidateStatus isActive={candidate.isActive} />
                        </div>

                        <div className="flex items-center gap-4 mt-3">
                          <div>
                            <p className="text-[11px] text-muted uppercase tracking-wide">
                              Gender
                            </p>

                            <p className="text-caption text-charcoal mt-0.5">
                              {candidate.gender ?? "—"}
                            </p>
                          </div>

                          <div className="ml-auto flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => setEditTarget(candidate)}
                              className="text-caption font-semibold text-navy hover:underline"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeactivateTarget(candidate)}
                              className="text-caption font-semibold text-red-600 hover:underline"
                            >
                              Deactivate
                            </button>
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

      {/* Add Candidate Modal */}
      <AddCandidateModal
        pageantId={pageantId}
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      {/* Edit Candidate Modal */}
      <EditCandidateModal
        pageantId={pageantId}
        candidate={editTarget}
        onClose={() => setEditTarget(null)}
      />

      {/* Deactivate Candidate Confirmation */}
      <DeactivateCandidateModal
        pageantId={pageantId}
        candidate={deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
      />
    </>
  );
}

function CandidateAvatar({
  photoUrl,
  displayName,
}: {
  photoUrl: string | null;
  displayName: string;
}) {
  if (photoUrl) {
    return (
      <div className="relative w-11 h-11 shrink-0 overflow-hidden rounded-full border border-border bg-slate/30">
        <Image
          src={photoUrl}
          alt={`${displayName} photo`}
          fill
          className="object-cover"
          sizes="44px"
        />
      </div>
    );
  }

  return (
    <div
      className="w-11 h-11 shrink-0 rounded-full border border-border bg-slate/50 flex items-center justify-center text-navy"
      aria-label={`${displayName} has no photo`}
    >
      <span className="text-small font-semibold">
        {displayName.charAt(0).toUpperCase()}
      </span>
    </div>
  );
}

function CandidateStatus({ isActive }: { isActive: boolean }) {
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