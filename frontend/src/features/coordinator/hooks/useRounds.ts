import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { coordinatorApi } from "../api/coordinator";
import type { CreateRoundRequest, UpdateRoundRequest } from "@/src/types";

const key = (pageantId: string) => ["coordinator", "pageants", pageantId, "rounds"] as const;

export function useRounds(pageantId: string) {
  return useQuery({
    queryKey: key(pageantId),
    queryFn: () => coordinatorApi.listRounds(pageantId),
    enabled: !!pageantId,
  });
}

export function useRound(pageantId: string, roundId: string) {
  return useQuery({
    queryKey: ["coordinator", "pageants", pageantId, "rounds", roundId],
    queryFn: () => coordinatorApi.getRound(pageantId, roundId),
    enabled: !!pageantId && !!roundId,
  });
}

export function useCreateRound(pageantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRoundRequest) => coordinatorApi.createRound(pageantId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: key(pageantId) }),
  });
}

export function useUpdateRound(pageantId: string, roundId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateRoundRequest) => coordinatorApi.updateRound(pageantId, roundId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: key(pageantId) }),
  });
}

export function useDeleteRound(pageantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (roundId: string) => coordinatorApi.deleteRound(pageantId, roundId),
    onSuccess: () => qc.invalidateQueries({ queryKey: key(pageantId) }),
  });
}
