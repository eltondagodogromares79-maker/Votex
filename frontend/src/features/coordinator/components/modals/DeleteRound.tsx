"use client";

import { ConfirmModal } from "@/src/components/ui/Modal";
import { useToast } from "@/src/components/ui/Toast";
import { ApiError } from "@/src/lib/api/client";
import { useDeleteRound } from "@/src/features/coordinator/hooks/useRounds";
import type { RoundResponse } from "@/src/types";

type DeleteRoundModalProps = {
  pageantId: string;
  round: RoundResponse | null;
  onClose: () => void;
};

export default function DeleteRoundModal({
  pageantId,
  round,
  onClose,
}: DeleteRoundModalProps) {
  const deleteRound = useDeleteRound(pageantId);
  const { toast } = useToast();

  async function handleConfirm() {
    if (!round) return;
    try {
      await deleteRound.mutateAsync(round.id);
      toast.success(`"${round.name}" has been deleted.`);
      onClose();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.userMessage : "Failed to delete round.");
    }
  }

  return (
    <ConfirmModal
      open={!!round}
      onClose={onClose}
      onConfirm={handleConfirm}
      title="Delete Round"
      description={
        round
          ? `Delete "${round.name}"? This action is permanent and cannot be undone — all data for this round will be removed.`
          : ""
      }
      confirmLabel="Delete"
      loading={deleteRound.isPending}
      destructive
    />
  );
}
