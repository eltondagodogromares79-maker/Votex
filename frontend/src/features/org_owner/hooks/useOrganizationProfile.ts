import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orgOwnerApi } from "../api/orgOwner";
import type { UpdateOrganizationProfileRequest } from "@/src/types";

const key = (orgId: string) => ["org_owner", orgId, "organization-profile"] as const;

export function useOrganizationProfile(orgId: string) {
  return useQuery({
    queryKey: key(orgId),
    queryFn: () => orgOwnerApi.getOrganization(orgId),
    enabled: !!orgId,
  });
}

export function useUpdateOrganizationProfile(orgId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateOrganizationProfileRequest) => orgOwnerApi.updateOrganization(orgId, data),
    onSuccess: (profile) => queryClient.setQueryData(key(orgId), profile),
  });
}
