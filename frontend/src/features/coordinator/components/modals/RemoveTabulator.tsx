"use client";

import { ConfirmModal } from "@/src/components/ui/Modal";
import { useToast } from "@/src/components/ui/Toast";
import { ApiError } from "@/src/lib/api/client";
import { useRevokeTabulator } from "@/src/features/coordinator/hooks/useStaff";
import type { PageantStaffResponse } from "@/src/types";

type RemoveTabulatorModalProps = {
  pageantId: string;
  tabulator: PageantStaffResponse | null;
  onClose: () => void;
};

export default function RemoveTabulatorModal({
  pageantId,
  tabulator,
  onClose,
}: RemoveTabulatorModalProps) {
  const revokeTabulator = useRevokeTabulator(pageantId);
  const { toast } = useToast();

  async function handleConfirm() {
    if (!tabulator) return;
    try {
      await revokeTabulator.mutateAsync(tabulator.userId);
      toast.success(`${tabulator.firstName} ${tabulator.lastName} removed as tabulator.`);
      onClose();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.userMessage : "Failed to remove tabulator.");
    }
  }

  return (
    <ConfirmModal
      open={!!tabulator}
      onClose={onClose}
      onConfirm={handleConfirm}
      title="Remove Tabulator"
      description={
        tabulator
          ? `Remove ${tabulator.firstName} ${tabulator.lastName} from this pageant? They will no longer be able to tabulate scores.`
          : ""
      }
      confirmLabel="Remove"
      loading={revokeTabulator.isPending}
      destructive
    />
  );
}
