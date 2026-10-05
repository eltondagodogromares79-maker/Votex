import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orgOwnerApi } from "../api/orgOwner";
import type { SubscribeRequest } from "@/src/types";

export function useAvailablePlans(orgId: string) {
  return useQuery({
    queryKey: ["org_owner", orgId, "subscription-plans"],
    queryFn: () => orgOwnerApi.listSubscriptionPlans(orgId),
    enabled: !!orgId,
  });
}

export function useSubscription(orgId: string) {
  return useQuery({
    queryKey: ["org_owner", orgId, "subscription"],
    queryFn: () => orgOwnerApi.getSubscription(orgId),
    enabled: !!orgId,
  });
}

export function useSubscriptionHistory(orgId: string) {
  return useQuery({
    queryKey: ["org_owner", orgId, "subscriptions"],
    queryFn: () => orgOwnerApi.listSubscriptionHistory(orgId),
    enabled: !!orgId,
  });
}

export function useSubscribe(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SubscribeRequest) => orgOwnerApi.subscribe(orgId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["org_owner", orgId, "subscription"] }),
  });
}

export function useCancelSubscription(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (subscriptionId: string) => orgOwnerApi.cancelSubscription(orgId, subscriptionId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["org_owner", orgId, "subscription"] }),
  });
}
