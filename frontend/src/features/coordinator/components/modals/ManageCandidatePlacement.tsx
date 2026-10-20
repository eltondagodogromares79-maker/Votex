"use client";

import { useEffect, useState } from "react";
import type { CandidateResponse } from "@/src/types";
import { useCandidatePlacements } from "@/src/features/coordinator/hooks/useContestants";
import { useCategories } from "@/src/features/coordinator/hooks/useCategories";
import { useRounds } from "@/src/features/coordinator/hooks/useRounds";
import { Modal } from "@/src/components/ui/Modal";
import { Button } from "@/src/components/ui/Button";
import { useToast } from "@/src/components/ui/Toast";
import { ApiError } from "@/src/lib/api/client";

export default function ManageCandidatePlacement({
  pageantId,
  candidate,
  onClose,
}: {
  pageantId: string;
  candidate: CandidateResponse | null;
  onClose: () => void;
}) {
  const contestantId = candidate?.id ?? "";
  const placements = useCandidatePlacements(pageantId, contestantId);
  const { data: categories = [] } = useCategories(pageantId);
  const { data: rounds = [] } = useRounds(pageantId);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [roundIds, setRoundIds] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (!placements.data) return;
    setCategoryIds(placements.data.categoryIds);
    setRoundIds(placements.data.roundIds);
  }, [placements.data]);

  async function save() {
    try {
      await placements.save.mutateAsync({ categoryIds, roundIds });
      toast.success("Candidate category and round assignments saved.");
      onClose();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.userMessage : "Could not save candidate assignments.");
    }
  }

  const toggle = (values: string[], setValues: (next: string[]) => void, id: string) => {
    setValues(values.includes(id) ? values.filter((value) => value !== id) : [...values, id]);
  };

  return (
    <Modal
      open={!!candidate}
      onClose={() => !placements.save.isPending && onClose()}
      title="Candidate assignments"
      description={candidate ? `Assign ${candidate.displayName} to pageant categories and rounds.` : ""}
      size="lg"
      footer={<>
        <Button variant="ghost" size="sm" onClick={onClose} disabled={placements.save.isPending}>Cancel</Button>
        <Button variant="secondary" size="sm" onClick={save} loading={placements.save.isPending} disabled={!candidate || placements.isLoading}>Save assignments</Button>
      </>}
    >
      {placements.isLoading ? <p className="text-small text-muted">Loading current assignments…</p> : placements.isError ? (
        <p className="border border-red-200 bg-red-50 p-4 text-small text-red-700">Unable to load candidate assignments.</p>
      ) : (
        <div className="space-y-6">
          <section>
            <h3 className="text-small font-semibold text-charcoal">Categories / divisions</h3>
            <p className="mt-1 text-caption text-muted">Assign only categories the candidate is eligible to enter. Eligibility is confirmed by the organizer.</p>
            <div className="mt-3 max-h-52 space-y-2 overflow-y-auto">
              {categories.filter((item) => item.isActive || categoryIds.includes(item.id)).map((category) => <label key={category.id} className="flex items-start gap-3 border border-border p-3">
                <input type="checkbox" className="mt-1 accent-navy" checked={categoryIds.includes(category.id)} onChange={() => toggle(categoryIds, setCategoryIds, category.id)} />
                <span><span className="block text-small text-charcoal">{category.name}{!category.isActive ? " · inactive" : ""}</span><span className="block text-caption text-muted">{category.eligibilityScope === "OPEN" ? "Open to all" : category.eligibilityScope.replaceAll("_", " ")}{category.eligibilityNotes ? ` · ${category.eligibilityNotes}` : ""}</span></span>
              </label>)}
              {!categories.some((item) => item.isActive) ? <p className="text-caption text-muted">Create categories before assigning candidates.</p> : null}
            </div>
          </section>
          <section>
            <h3 className="text-small font-semibold text-charcoal">Rounds</h3>
            <p className="mt-1 text-caption text-muted">Round removal is blocked after advancement or scoring has started.</p>
            <div className="mt-3 max-h-52 space-y-2 overflow-y-auto">
              {rounds.map((round) => <label key={round.id} className="flex items-center gap-3 border border-border p-3">
                <input type="checkbox" className="accent-navy" checked={roundIds.includes(round.id)} onChange={() => toggle(roundIds, setRoundIds, round.id)} />
                <span className="text-small text-charcoal">Round {round.roundNumber}: {round.name} <span className="text-caption text-muted">· {round.status}</span></span>
              </label>)}
              {!rounds.length ? <p className="text-caption text-muted">Create rounds before assigning candidates.</p> : null}
            </div>
          </section>
        </div>
      )}
    </Modal>
  );
}
