"use client";

import { ConfirmModal } from "@/src/components/ui/Modal";
import { useToast } from "@/src/components/ui/Toast";
import { ApiError } from "@/src/lib/api/client";
import { useDeactivateCategory } from "@/src/features/coordinator/hooks/useCategories";
import type { CategoryResponse } from "@/src/types";

type DeactivateCategoryModalProps = {
  pageantId: string;
  category: CategoryResponse | null;
  onClose: () => void;
};

export default function DeactivateCategoryModal({
  pageantId,
  category,
  onClose,
}: DeactivateCategoryModalProps) {
  const deactivateCategory = useDeactivateCategory(pageantId);
  const { toast } = useToast();

  async function handleConfirm() {
    if (!category) return;
    try {
      await deactivateCategory.mutateAsync(category.id);
      toast.success(`${category.name} has been deactivated.`);
      onClose();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.userMessage : "Failed to deactivate category.");
    }
  }

  return (
    <ConfirmModal
      open={!!category}
      onClose={onClose}
      onConfirm={handleConfirm}
      title="Deactivate Category"
      description={
        category
          ? `Deactivate "${category.name}" (${category.code})? It will be excluded from judging until reactivated.`
          : ""
      }
      confirmLabel="Deactivate"
      loading={deactivateCategory.isPending}
      destructive
    />
  );
}
