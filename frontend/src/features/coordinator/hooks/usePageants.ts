import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { coordinatorApi } from "../api/coordinator";
import type { UpdatePageantRequest } from "@/src/types";

export function useAssignedPageants() {
  return useQuery({
    queryKey: ["coordinator", "pageants"],
    queryFn: () => coordinatorApi.listPageants(),
  });
}

export function useAssignedPageant(pageantId: string) {
  return useQuery({
    queryKey: ["coordinator", "pageants", pageantId],
    queryFn: () => coordinatorApi.getPageant(pageantId),
    enabled: !!pageantId,
  });
}

export function useUpdateAssignedPageant(pageantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdatePageantRequest) => coordinatorApi.updatePageant(pageantId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coordinator", "pageants", pageantId] }),
  });
}
