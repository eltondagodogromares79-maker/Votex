import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orgOwnerApi } from "../api/orgOwner";
import type { CreatePageantRequest, UpdatePageantRequest } from "@/src/types";

const key = (orgId: string) => ["org_owner", orgId, "pageants"] as const;

export function usePageants(orgId: string) {
  return useQuery({
    queryKey: key(orgId),
    queryFn: () => orgOwnerApi.listPageants(orgId),
    enabled: !!orgId,
  });
}

export function usePageant(orgId: string, pageantId: string) {
  return useQuery({
    queryKey: ["org_owner", orgId, "pageants", pageantId],
    queryFn: () => orgOwnerApi.getPageant(orgId, pageantId),
    enabled: !!orgId && !!pageantId,
  });
}

export function useCreatePageant(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePageantRequest) => orgOwnerApi.createPageant(orgId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: key(orgId) }),
  });
}

export function useUpdatePageant(orgId: string, pageantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdatePageantRequest) => orgOwnerApi.updatePageant(orgId, pageantId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: key(orgId) }),
  });
}

export function useArchivePageant(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (pageantId: string) => orgOwnerApi.archivePageant(orgId, pageantId),
    onSuccess: () => qc.invalidateQueries({ queryKey: key(orgId) }),
  });
}
