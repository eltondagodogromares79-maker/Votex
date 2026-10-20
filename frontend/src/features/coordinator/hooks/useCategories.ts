import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { coordinatorApi } from "../api/coordinator";
import type { CreateCategoryRequest, CreateCriterionRequest, RoundJudgingConfiguration } from "@/src/types";

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
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: catKey(pageantId) }),
        qc.invalidateQueries({ queryKey: ["coordinator", "pageants", pageantId, "rounds"] }),
        qc.invalidateQueries({ queryKey: ["coordinator", "pageants", pageantId, "resource-limits"] }),
      ]);
    },
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
    onSuccess: () => Promise.all([
      qc.invalidateQueries({ queryKey: catKey(pageantId) }),
      qc.invalidateQueries({ queryKey: ["coordinator", "pageants", pageantId, "resource-limits"] }),
    ]),
  });
}

export function useActivateCategory(pageantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (categoryId: string) => coordinatorApi.activateCategory(pageantId, categoryId),
    onSuccess: () => Promise.all([
      qc.invalidateQueries({ queryKey: catKey(pageantId) }),
      qc.invalidateQueries({ queryKey: ["coordinator", "pageants", pageantId, "resource-limits"] }),
    ]),
  });
}

export function useUpdateCategoryStatus(pageantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ categoryId, status }: { categoryId: string; status: "DRAFT" | "OPEN" | "CLOSED" | "COMPLETED" }) => coordinatorApi.updateCategoryStatus(pageantId, categoryId, status),
    onSuccess: () => Promise.all([
      qc.invalidateQueries({ queryKey: catKey(pageantId) }),
      qc.invalidateQueries({ queryKey: ["judge", "pageants", pageantId, "categories"] }),
    ]),
  });
}

// ─── Criteria ─────────────────────────────────────────────────────────────────

const critKey = (pageantId: string) => ["coordinator", "pageants", pageantId, "criteria"] as const;

export function useRoundJudgingConfiguration(pageantId: string, roundId: string) {
  const qc = useQueryClient();
  const queryKey = ["coordinator", "pageants", pageantId, "rounds", roundId, "judging-configuration"] as const;
  const query = useQuery({
    queryKey,
    queryFn: () => coordinatorApi.getRoundJudgingConfiguration(pageantId, roundId),
    enabled: !!pageantId && !!roundId,
  });
  const mutation = useMutation({
    mutationFn: (data: RoundJudgingConfiguration) => coordinatorApi.saveRoundJudgingConfiguration(pageantId, roundId, data),
    onSuccess: (data) => {
      qc.setQueryData(queryKey, data);
      qc.invalidateQueries({ queryKey: ["coordinator", "pageants", pageantId, "resource-limits"] });
    },
  });
  return { ...query, save: mutation };
}

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

export function useActivateCriterion(pageantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (criterionId: string) => coordinatorApi.activateCriterion(pageantId, criterionId),
    onSuccess: () => qc.invalidateQueries({ queryKey: critKey(pageantId) }),
  });
}
