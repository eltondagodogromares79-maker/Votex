"use client";

import { ConfirmModal } from "@/src/components/ui/Modal";
import { useToast } from "@/src/components/ui/Toast";
import { ApiError } from "@/src/lib/api/client";
import { useDeactivateCriterion } from "@/src/features/coordinator/hooks/useCategories";
import type { CriterionResponse } from "@/src/types";

type DeactivateCriterionModalProps = {
  pageantId: string;
  criterion: CriterionResponse | null;
  onClose: () => void;
};

export default function DeactivateCriterionModal({
  pageantId,
  criterion,
  onClose,
}: DeactivateCriterionModalProps) {
  const deactivateCriterion = useDeactivateCriterion(pageantId);
  const { toast } = useToast();

  async function handleConfirm() {
    if (!criterion) return;
    try {
      await deactivateCriterion.mutateAsync(criterion.id);
      toast.success(`${criterion.name} has been deactivated.`);
      onClose();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.userMessage : "Failed to deactivate criterion.");
    }
  }

  return (
    <ConfirmModal
      open={!!criterion}
      onClose={onClose}
      onConfirm={handleConfirm}
      title="Deactivate Criterion"
      description={
        criterion
          ? `Deactivate "${criterion.name}" (${criterion.code})? It will be excluded from judging until reactivated.`
          : ""
      }
      confirmLabel="Deactivate"
      loading={deactivateCriterion.isPending}
      destructive
    />
  );
}
