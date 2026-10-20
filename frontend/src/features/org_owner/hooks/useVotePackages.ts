import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orgOwnerApi } from "../api/orgOwner";
import type { CreateVotePackageRequest, UpdateVotePackageRequest } from "@/src/types";

const key = (orgId: string, pageantId: string) =>
  ["org_owner", orgId, "pageants", pageantId, "vote-packages"] as const;

export function useVotePackages(orgId: string, pageantId: string) {
  return useQuery({
    queryKey: key(orgId, pageantId),
    queryFn: () => orgOwnerApi.listVotePackages(orgId, pageantId),
    enabled: !!orgId && !!pageantId,
  });
}

export function useCreateVotePackage(orgId: string, pageantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateVotePackageRequest) => orgOwnerApi.createVotePackage(orgId, pageantId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: key(orgId, pageantId) }),
  });
}

export function useUpdateVotePackage(orgId: string, pageantId: string, packageId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateVotePackageRequest) => orgOwnerApi.updateVotePackage(orgId, pageantId, packageId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: key(orgId, pageantId) }),
  });
}

export function useDeactivateVotePackage(orgId: string, pageantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (packageId: string) => orgOwnerApi.deactivateVotePackage(orgId, pageantId, packageId),
    onSuccess: () => qc.invalidateQueries({ queryKey: key(orgId, pageantId) }),
  });
}

export function useActivateVotePackage(orgId: string, pageantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (packageId: string) => orgOwnerApi.activateVotePackage(orgId, pageantId, packageId),
    onSuccess: () => qc.invalidateQueries({ queryKey: key(orgId, pageantId) }),
  });
}
