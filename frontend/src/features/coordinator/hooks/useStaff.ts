import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { coordinatorApi } from "../api/coordinator";
import type { AssignPageantStaffRequest } from "@/src/types";

// ─── Judges ───────────────────────────────────────────────────────────────────

export function useJudges(pageantId: string) {
  return useQuery({
    queryKey: ["coordinator", "pageants", pageantId, "judges"],
    queryFn: () => coordinatorApi.listJudges(pageantId),
    enabled: !!pageantId,
  });
}

export function useAssignJudge(pageantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AssignPageantStaffRequest) => coordinatorApi.assignJudge(pageantId, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["coordinator", "pageants", pageantId, "judges"] }); qc.invalidateQueries({ queryKey: ["coordinator", "pageants", pageantId, "resource-limits"] }); },
  });
}

export function useRevokeJudge(pageantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => coordinatorApi.revokeJudge(pageantId, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coordinator", "pageants", pageantId, "judges"] }),
  });
}

export function useActivateJudge(pageantId: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (userId: string) => coordinatorApi.activateJudge(pageantId, userId), onSuccess: () => { qc.invalidateQueries({ queryKey: ["coordinator", "pageants", pageantId, "judges"] }); qc.invalidateQueries({ queryKey: ["coordinator", "pageants", pageantId, "resource-limits"] }); } });
}

export function useDeleteJudgeAssignment(pageantId: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (userId: string) => coordinatorApi.deleteJudgeAssignment(pageantId, userId), onSuccess: () => { qc.invalidateQueries({ queryKey: ["coordinator", "pageants", pageantId, "judges"] }); qc.invalidateQueries({ queryKey: ["coordinator", "pageants", pageantId, "resource-limits"] }); } });
}

// ─── Tabulators ───────────────────────────────────────────────────────────────

export function useTabulators(pageantId: string) {
  return useQuery({
    queryKey: ["coordinator", "pageants", pageantId, "tabulators"],
    queryFn: () => coordinatorApi.listTabulators(pageantId),
    enabled: !!pageantId,
  });
}

export function useAssignTabulator(pageantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AssignPageantStaffRequest) => coordinatorApi.assignTabulator(pageantId, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["coordinator", "pageants", pageantId, "tabulators"] }); qc.invalidateQueries({ queryKey: ["coordinator", "pageants", pageantId, "resource-limits"] }); },
  });
}

export function useRevokeTabulator(pageantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => coordinatorApi.revokeTabulator(pageantId, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coordinator", "pageants", pageantId, "tabulators"] }),
  });
}

export function useActivateTabulator(pageantId: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (userId: string) => coordinatorApi.activateTabulator(pageantId, userId), onSuccess: () => { qc.invalidateQueries({ queryKey: ["coordinator", "pageants", pageantId, "tabulators"] }); qc.invalidateQueries({ queryKey: ["coordinator", "pageants", pageantId, "resource-limits"] }); } });
}

export function useDeleteTabulatorAssignment(pageantId: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (userId: string) => coordinatorApi.deleteTabulatorAssignment(pageantId, userId), onSuccess: () => { qc.invalidateQueries({ queryKey: ["coordinator", "pageants", pageantId, "tabulators"] }); qc.invalidateQueries({ queryKey: ["coordinator", "pageants", pageantId, "resource-limits"] }); } });
}
