import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { coordinatorApi } from "../api/coordinator";
import type { AddCandidateRequest, CandidatePlacements } from "@/src/types";

const key = (pageantId: string) => ["coordinator", "pageants", pageantId, "contestants"] as const;

export function useContestants(pageantId: string) {
  return useQuery({
    queryKey: key(pageantId),
    queryFn: () => coordinatorApi.listContestants(pageantId),
    enabled: !!pageantId,
  });
}

export function useContestant(pageantId: string, contestantId: string) {
  return useQuery({
    queryKey: ["coordinator", "pageants", pageantId, "contestants", contestantId],
    queryFn: () => coordinatorApi.getContestant(pageantId, contestantId),
    enabled: !!pageantId && !!contestantId,
  });
}

export function useCreateContestant(pageantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AddCandidateRequest) => coordinatorApi.createContestant(pageantId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: key(pageantId) }),
  });
}

export function useUpdateContestant(pageantId: string, contestantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AddCandidateRequest) => coordinatorApi.updateContestant(pageantId, contestantId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: key(pageantId) }),
  });
}

export function useDeactivateContestant(pageantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (contestantId: string) => coordinatorApi.deactivateContestant(pageantId, contestantId),
    onSuccess: () => qc.invalidateQueries({ queryKey: key(pageantId) }),
  });
}

export function useCandidatePlacements(pageantId: string, contestantId: string) {
  const qc = useQueryClient();
  const queryKey = ["coordinator", "pageants", pageantId, "contestants", contestantId, "placements"] as const;
  const query = useQuery({
    queryKey,
    queryFn: () => coordinatorApi.getContestantPlacements(pageantId, contestantId),
    enabled: !!pageantId && !!contestantId,
  });
  const mutation = useMutation({
    mutationFn: (data: CandidatePlacements) => coordinatorApi.saveContestantPlacements(pageantId, contestantId, data),
    onSuccess: (data) => qc.setQueryData(queryKey, data),
  });
  return { ...query, save: mutation };
}
