import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orgOwnerApi } from "../api/orgOwner";
import type { AssignPageantStaffRequest } from "@/src/types";

// ─── Judges ───────────────────────────────────────────────────────────────────

export function usePageantJudges(orgId: string, pageantId: string) {
  return useQuery({
    queryKey: ["org_owner", orgId, "pageants", pageantId, "judges"],
    queryFn: () => orgOwnerApi.listJudges(orgId, pageantId),
    enabled: !!orgId && !!pageantId,
  });
}

export function useAssignJudge(orgId: string, pageantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AssignPageantStaffRequest) => orgOwnerApi.assignJudge(orgId, pageantId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["org_owner", orgId, "pageants", pageantId, "judges"] }),
  });
}

export function useRevokeJudge(orgId: string, pageantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => orgOwnerApi.revokeJudge(orgId, pageantId, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["org_owner", orgId, "pageants", pageantId, "judges"] }),
  });
}

// ─── Tabulators ───────────────────────────────────────────────────────────────

export function usePageantTabulators(orgId: string, pageantId: string) {
  return useQuery({
    queryKey: ["org_owner", orgId, "pageants", pageantId, "tabulators"],
    queryFn: () => orgOwnerApi.listTabulators(orgId, pageantId),
    enabled: !!orgId && !!pageantId,
  });
}

export function useAssignTabulator(orgId: string, pageantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AssignPageantStaffRequest) => orgOwnerApi.assignTabulator(orgId, pageantId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["org_owner", orgId, "pageants", pageantId, "tabulators"] }),
  });
}

export function useRevokeTabulator(orgId: string, pageantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => orgOwnerApi.revokeTabulator(orgId, pageantId, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["org_owner", orgId, "pageants", pageantId, "tabulators"] }),
  });
}

// ─── Pageant Coordinators ─────────────────────────────────────────────────────

export function usePageantCoordinators(orgId: string, pageantId: string) {
  return useQuery({
    queryKey: ["org_owner", orgId, "pageants", pageantId, "coordinators"],
    queryFn: () => orgOwnerApi.listPageantCoordinators(orgId, pageantId),
    enabled: !!orgId && !!pageantId,
  });
}

export function useAssignPageantCoordinator(orgId: string, pageantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AssignPageantStaffRequest) => orgOwnerApi.assignPageantCoordinator(orgId, pageantId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["org_owner", orgId, "pageants", pageantId, "coordinators"] }),
  });
}

export function useRevokePageantCoordinator(orgId: string, pageantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => orgOwnerApi.revokePageantCoordinator(orgId, pageantId, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["org_owner", orgId, "pageants", pageantId, "coordinators"] }),
  });
}
