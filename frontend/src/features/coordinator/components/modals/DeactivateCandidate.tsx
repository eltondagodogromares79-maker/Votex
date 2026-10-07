"use client";

import { ConfirmModal } from "@/src/components/ui/Modal";
import { useToast } from "@/src/components/ui/Toast";
import { ApiError } from "@/src/lib/api/client";
import { useDeactivateContestant } from "@/src/features/coordinator/hooks/useContestants";
import type { CandidateResponse } from "@/src/types";

type DeactivateCandidateModalProps = {
  pageantId: string;
  candidate: CandidateResponse | null;
  onClose: () => void;
};

export default function DeactivateCandidateModal({
  pageantId,
  candidate,
  onClose,
}: DeactivateCandidateModalProps) {
  const deactivateContestant = useDeactivateContestant(pageantId);
  const { toast } = useToast();

  async function handleConfirm() {
    if (!candidate) return;
    try {
      await deactivateContestant.mutateAsync(candidate.id);
      toast.success(`${candidate.displayName} has been deactivated.`);
      onClose();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.userMessage : "Failed to deactivate candidate.");
    }
  }

  return (
    <ConfirmModal
      open={!!candidate}
      onClose={onClose}
      onConfirm={handleConfirm}
      title="Deactivate Candidate"
      description={
        candidate
          ? `Deactivate ${candidate.displayName} (Candidate #${candidate.contestantNumber})? They will be marked inactive and excluded from voting and judging. This can only be undone by contacting support.`
          : ""
      }
      confirmLabel="Deactivate"
      loading={deactivateContestant.isPending}
      destructive
    />
  );
}
