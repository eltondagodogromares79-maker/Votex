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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coordinator", "pageants", pageantId, "judges"] }),
  });
}

export function useRevokeJudge(pageantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => coordinatorApi.revokeJudge(pageantId, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coordinator", "pageants", pageantId, "judges"] }),
  });
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coordinator", "pageants", pageantId, "tabulators"] }),
  });
}

export function useRevokeTabulator(pageantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => coordinatorApi.revokeTabulator(pageantId, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coordinator", "pageants", pageantId, "tabulators"] }),
  });
}
