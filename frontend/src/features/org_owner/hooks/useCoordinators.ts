import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orgOwnerApi } from "../api/orgOwner";
import type { CreateCoordinatorRequest } from "@/src/types";

const key = (orgId: string) => ["org_owner", orgId, "coordinators"] as const;

export function useCoordinators(orgId: string) {
  return useQuery({
    queryKey: key(orgId),
    queryFn: () => orgOwnerApi.listCoordinators(orgId),
    enabled: !!orgId,
  });
}

export function useCoordinator(orgId: string, userId: string) {
  return useQuery({
    queryKey: ["org_owner", orgId, "coordinators", userId],
    queryFn: () => orgOwnerApi.getCoordinator(orgId, userId),
    enabled: !!orgId && !!userId,
  });
}

export function useAddCoordinator(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCoordinatorRequest) => orgOwnerApi.addCoordinator(orgId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: key(orgId) }),
  });
}

export function useUpdateCoordinator(orgId: string, userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { email: string; firstName: string; lastName: string }) =>
      orgOwnerApi.updateCoordinator(orgId, userId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: key(orgId) }),
  });
}

export function useResendCoordinatorCredentials(orgId: string) {
  return useMutation({
    mutationFn: (userId: string) => orgOwnerApi.resendCoordinatorCredentials(orgId, userId),
  });
}

export function useReplaceCoordinator(orgId: string, userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCoordinatorRequest) => orgOwnerApi.replaceCoordinator(orgId, userId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: key(orgId) }),
  });
}

export function useRemoveCoordinator(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => orgOwnerApi.removeCoordinator(orgId, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: key(orgId) }),
  });
}

export function useSetCoordinatorActive(orgId: string, active: boolean) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (userId: string) => active ? orgOwnerApi.activateCoordinator(orgId, userId) : orgOwnerApi.deactivateCoordinator(orgId, userId), onSuccess: () => qc.invalidateQueries({ queryKey: key(orgId) }) });
}
