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

const listActionClass = "inline-flex min-h-8 items-center justify-center rounded px-3 py-1.5 text-caption font-semibold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1";

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
  const candidateGroups = [
    { label: "Female", candidates: candidateList.filter((candidate) => candidate.gender?.toLowerCase() !== "male") },
    { label: "Male", candidates: candidateList.filter((candidate) => candidate.gender?.toLowerCase() === "male") },
  ];

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
          <div className="mt-5 grid items-start gap-5 lg:grid-cols-2">
            {candidateGroups.map((group) => (
              <section key={group.label} className={`min-w-0 overflow-hidden border border-border bg-white ${group.label === "Female" ? "lg:order-1" : "lg:order-2"}`}>
                <header className="flex items-center justify-between border-b border-border bg-slate/30 px-4 py-3 sm:px-5">
                  <h5 className="font-serif text-lg font-semibold text-navy">{group.label}</h5>
                  <span className="text-xs text-muted">{group.candidates.length} {group.candidates.length === 1 ? "candidate" : "candidates"}</span>
                </header>
                {group.candidates.length === 0 ? (
                  <p className="px-5 py-8 text-center text-sm text-muted">No {group.label.toLowerCase()} candidates yet.</p>
                ) : (
                  <div className="divide-y divide-border">
                    {group.candidates.map((candidate) => (
                      <article key={candidate.id} className="flex min-w-0 flex-col gap-4 p-4 transition-colors hover:bg-slate/10 sm:flex-row sm:items-center sm:p-5">
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <CandidateAvatar photoUrl={candidate.photoUrl} displayName={candidate.displayName} />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="break-words text-sm font-semibold text-charcoal [overflow-wrap:anywhere]">{candidate.displayName}</p>
                              <span className="shrink-0 bg-navy/5 px-2 py-0.5 text-xs font-semibold text-navy">#{candidate.contestantNumber}</span>
                            </div>
                            <p className="mt-0.5 break-words text-xs text-muted [overflow-wrap:anywhere]">{candidate.firstName} {candidate.middleName ? `${candidate.middleName} ` : ""}{candidate.lastName}</p>
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">Status</span>
                              <CandidateRoundStatus status={candidate.currentRoundStatus} roundName={candidate.currentRoundName} />
                              {!candidate.isActive ? <CandidateStatus isActive={false} /> : null}
                            </div>
                            {!candidate.currentRoundStatus ? <p className="mt-1 text-xs text-muted">Not entered in a round yet.</p> : null}
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
                          <button type="button" onClick={() => setEditTarget(candidate)} className={`${listActionClass} bg-navy text-white hover:bg-navy/90 focus-visible:ring-navy`}>Edit</button>
                          <button type="button" onClick={() => setDeactivateTarget(candidate)} className={`${listActionClass} bg-error text-white hover:bg-error/90 focus-visible:ring-error`}>Deactivate</button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            ))}
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

function CandidateRoundStatus({ status, roundName }: { status?: string | null; roundName?: string | null }) {
  const normalized = status?.toUpperCase();
  const styles: Record<string, string> = {
    REGISTERED: "border border-slate-300 bg-slate-100 text-slate-800",
    QUALIFIED: "border border-blue-300 bg-blue-100 text-blue-800",
    ADVANCED: "border border-green-300 bg-green-100 text-green-800",
    ELIMINATED: "border border-amber-300 bg-amber-100 text-amber-900",
    DISQUALIFIED: "border border-red-300 bg-red-100 text-red-800",
    WITHDRAWN: "border border-slate-300 bg-slate-100 text-slate-700",
  };
  const label = normalized?.toLowerCase().replaceAll("_", " ") ?? "registered";
  return <span className={`inline-flex items-center border px-3 py-1.5 text-xs font-bold capitalize ${styles[normalized ?? "REGISTERED"]}`}>
    {label}{roundName ? ` · ${roundName}` : ""}
  </span>;
}
