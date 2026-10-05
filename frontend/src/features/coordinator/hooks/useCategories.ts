import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { coordinatorApi } from "../api/coordinator";
import type { CreateCategoryRequest, CreateCriterionRequest } from "@/src/types";

// ─── Categories ───────────────────────────────────────────────────────────────

const catKey = (pageantId: string) => ["coordinator", "pageants", pageantId, "categories"] as const;

export function useCategories(pageantId: string) {
  return useQuery({
    queryKey: catKey(pageantId),
    queryFn: () => coordinatorApi.listCategories(pageantId),
    enabled: !!pageantId,
  });
}

export function useCreateCategory(pageantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCategoryRequest) => coordinatorApi.createCategory(pageantId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: catKey(pageantId) }),
  });
}

export function useUpdateCategory(pageantId: string, categoryId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCategoryRequest) => coordinatorApi.updateCategory(pageantId, categoryId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: catKey(pageantId) }),
  });
}

export function useDeactivateCategory(pageantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (categoryId: string) => coordinatorApi.deactivateCategory(pageantId, categoryId),
    onSuccess: () => qc.invalidateQueries({ queryKey: catKey(pageantId) }),
  });
}

// ─── Criteria ─────────────────────────────────────────────────────────────────

const critKey = (pageantId: string) => ["coordinator", "pageants", pageantId, "criteria"] as const;

export function useCriteria(pageantId: string) {
  return useQuery({
    queryKey: critKey(pageantId),
    queryFn: () => coordinatorApi.listCriteria(pageantId),
    enabled: !!pageantId,
  });
}

export function useCreateCriterion(pageantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCriterionRequest) => coordinatorApi.createCriterion(pageantId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: critKey(pageantId) }),
  });
}

export function useUpdateCriterion(pageantId: string, criterionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCriterionRequest) => coordinatorApi.updateCriterion(pageantId, criterionId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: critKey(pageantId) }),
  });
}

export function useDeactivateCriterion(pageantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (criterionId: string) => coordinatorApi.deactivateCriterion(pageantId, criterionId),
    onSuccess: () => qc.invalidateQueries({ queryKey: critKey(pageantId) }),
  });
}
