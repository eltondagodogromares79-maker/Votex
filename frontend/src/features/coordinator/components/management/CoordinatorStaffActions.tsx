"use client";

import { useState } from "react";
import { ConfirmModal } from "@/src/components/ui/Modal";
import { useToast } from "@/src/components/ui/Toast";
import { ApiError } from "@/src/lib/api/client";
import type { PageantStaffResponse } from "@/src/types";
import { useActivateJudge, useDeleteJudgeAssignment, useRevokeJudge, useActivateTabulator, useDeleteTabulatorAssignment, useRevokeTabulator } from "@/src/features/coordinator/hooks/useStaff";

type Action = "activate" | "deactivate" | "delete";
export default function CoordinatorStaffActions({ pageantId, staff, role }: { pageantId: string; staff: PageantStaffResponse; role: "judge" | "tabulator" }) {
  const [action, setAction] = useState<Action | null>(null);
  const { toast } = useToast();
  const activateJudge = useActivateJudge(pageantId), deactivateJudge = useRevokeJudge(pageantId), deleteJudge = useDeleteJudgeAssignment(pageantId);
  const activateTabulator = useActivateTabulator(pageantId), deactivateTabulator = useRevokeTabulator(pageantId), deleteTabulator = useDeleteTabulatorAssignment(pageantId);
  const mutation = role === "judge"
    ? action === "activate" ? activateJudge : action === "delete" ? deleteJudge : deactivateJudge
    : action === "activate" ? activateTabulator : action === "delete" ? deleteTabulator : deactivateTabulator;
  async function confirm() {
    if (!action) return;
    try {
      await mutation.mutateAsync(staff.userId);
      toast.success(action === "delete" ? `${staff.firstName} ${staff.lastName} assignment deleted.` : `${staff.firstName} ${staff.lastName} ${action === "activate" ? "activated" : "deactivated"}.`);
      setAction(null);
    } catch (error) { toast.error(error instanceof ApiError ? error.userMessage : "Unable to update this staff assignment."); }
  }
  const btn = "inline-flex min-h-8 items-center justify-center rounded px-3 py-1.5 text-caption font-semibold whitespace-nowrap";
  return <>
    {staff.isActive ? <button type="button" onClick={() => setAction("deactivate")} className={`${btn} bg-error text-white hover:bg-error/90`}>Deactivate</button>
      : <button type="button" onClick={() => setAction("activate")} className={`${btn} bg-navy text-white hover:bg-navy/90`}>Activate</button>}
    <button type="button" onClick={() => setAction("delete")} className={`${btn} border border-error/30 text-error hover:bg-error/10`}>Delete</button>
    <ConfirmModal open={!!action} onClose={() => setAction(null)} onConfirm={confirm} title={action === "delete" ? "Delete assignment permanently?" : action === "activate" ? "Activate staff assignment?" : "Deactivate staff assignment?"}
      description={action === "delete" ? `This permanently removes ${staff.firstName} ${staff.lastName} from this pageant. Their login account and other pageant assignments remain.` : `${staff.firstName} ${staff.lastName} will ${action === "activate" ? "be able to access" : "lose access to"} this pageant.`}
      confirmLabel={action === "delete" ? "Delete assignment" : action === "activate" ? "Activate" : "Deactivate"} loading={mutation.isPending} destructive={action !== "activate"} />
  </>;
}
