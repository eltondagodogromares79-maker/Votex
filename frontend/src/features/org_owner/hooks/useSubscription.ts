import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orgOwnerApi } from "../api/orgOwner";
import type { SubscribeRequest, SubmitPaymentProofRequest } from "@/src/types";

export function useAvailablePlans(orgId: string) {
  return useQuery({
    queryKey: ["org_owner", orgId, "subscription-plans"],
    queryFn: () => orgOwnerApi.listSubscriptionPlans(orgId),
    enabled: !!orgId,
  });
}

export function useSubscriptionPaymentMode(orgId: string) {
  return useQuery({
    queryKey: ["org_owner", orgId, "subscription-payment-mode"],
    queryFn: () => orgOwnerApi.getSubscriptionPaymentMode(orgId),
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

export function useSubscriptionUsage(orgId: string) {
  return useQuery({
    queryKey: ["org_owner", orgId, "subscription-usage"],
    queryFn: () => orgOwnerApi.getSubscriptionUsage(orgId),
    enabled: !!orgId,
  });
}

export function usePendingSubscriptionPayment(orgId: string) {
  return useQuery({
    queryKey: ["org_owner", orgId, "pending-subscription-payment"],
    queryFn: () => orgOwnerApi.getPendingSubscriptionPayment(orgId),
    enabled: !!orgId,
  });
}

export function useSubmitSubscriptionPaymentProof(orgId: string, subscriptionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SubmitPaymentProofRequest) =>
      orgOwnerApi.submitSubscriptionPaymentProof(orgId, subscriptionId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["org_owner", orgId, "pending-subscription-payment"] }),
  });
}

export function useCreateSubscriptionCheckout(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (subscriptionId: string) => orgOwnerApi.createSubscriptionCheckout(orgId, subscriptionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["org_owner", orgId, "pending-subscription-payment"] });
      qc.invalidateQueries({ queryKey: ["org_owner", orgId, "subscriptions"] });
    },
  });
}

export function useSubscriptionHistory(orgId: string) {
  return useQuery({
    queryKey: ["org_owner", orgId, "subscriptions"],
    queryFn: () => orgOwnerApi.listSubscriptionHistory(orgId),
    enabled: !!orgId,
  });
}

export function usePaymentProofHistory(orgId: string) {
  return useQuery({
    queryKey: ["org_owner", orgId, "payment-proof-history"],
    queryFn: () => orgOwnerApi.listPaymentProofHistory(orgId),
    enabled: !!orgId,
  });
}

export function useSubscribe(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SubscribeRequest) => orgOwnerApi.subscribe(orgId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["org_owner", orgId, "subscription"] });
      qc.invalidateQueries({ queryKey: ["org_owner", orgId, "pending-subscription-payment"] });
    },
  });
}

export function useCancelSubscription(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (subscriptionId: string) => orgOwnerApi.cancelSubscription(orgId, subscriptionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["org_owner", orgId, "subscription"] });
      qc.invalidateQueries({ queryKey: ["org_owner", orgId, "subscription-usage"] });
    },
  });
}
