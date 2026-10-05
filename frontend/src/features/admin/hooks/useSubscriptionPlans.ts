import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../api/admin";
import type { SubscriptionPlanRequest } from "@/src/types";

export const PLANS_QUERY_KEY = ["admin", "subscription-plans"] as const;

export function useSubscriptionPlans() {
  return useQuery({
    queryKey: PLANS_QUERY_KEY,
    queryFn: () => adminApi.listSubscriptionPlans(),
  });
}

export function useSubscriptionPlan(id: string) {
  return useQuery({
    queryKey: ["admin", "subscription-plans", id],
    queryFn: () => adminApi.getSubscriptionPlan(id),
    enabled: !!id,
  });
}

export function useCreateSubscriptionPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SubscriptionPlanRequest) => adminApi.createSubscriptionPlan(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PLANS_QUERY_KEY }),
  });
}

export function useUpdateSubscriptionPlan(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SubscriptionPlanRequest) => adminApi.updateSubscriptionPlan(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PLANS_QUERY_KEY }),
  });
}

export function useDeactivateSubscriptionPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deactivateSubscriptionPlan(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PLANS_QUERY_KEY }),
  });
}
