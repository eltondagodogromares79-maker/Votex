"use client";

import { ConfirmModal } from "@/src/components/ui/Modal";
import { useToast } from "@/src/components/ui/Toast";
import { ApiError } from "@/src/lib/api/client";
import { useRevokeJudge } from "@/src/features/coordinator/hooks/useStaff";
import type { PageantStaffResponse } from "@/src/types";

type RemoveJudgeModalProps = {
  pageantId: string;
  judge: PageantStaffResponse | null;
  onClose: () => void;
};

export default function RemoveJudgeModal({
  pageantId,
  judge,
  onClose,
}: RemoveJudgeModalProps) {
  const revokeJudge = useRevokeJudge(pageantId);
  const { toast } = useToast();

  async function handleConfirm() {
    if (!judge) return;
    try {
      await revokeJudge.mutateAsync(judge.userId);
      toast.success(`${judge.firstName} ${judge.lastName} removed.`);
      onClose();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.userMessage : "Failed to remove judge.");
    }
  }

  return (
    <ConfirmModal
      open={!!judge}
      onClose={onClose}
      onConfirm={handleConfirm}
      title="Remove Judge"
      description={
        judge
          ? `Remove ${judge.firstName} ${judge.lastName} from this pageant? They will no longer be able to submit scores.`
          : ""
      }
      confirmLabel="Remove"
      loading={revokeJudge.isPending}
      destructive
    />
  );
}
