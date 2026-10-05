import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { audienceApi } from "../api/audience";
import type { StartVoteRequest } from "@/src/types";

export function useVotePackages(pageantId: string) {
  return useQuery({
    queryKey: ["audience", "pageants", pageantId, "vote-packages"],
    queryFn: () => audienceApi.listVotePackages(pageantId),
    enabled: !!pageantId,
  });
}

export function useVoteCandidates(pageantId: string) {
  return useQuery({
    queryKey: ["audience", "pageants", pageantId, "contestants"],
    queryFn: () => audienceApi.listContestants(pageantId),
    enabled: !!pageantId,
  });
}

export function useStartVote(pageantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: StartVoteRequest) => audienceApi.startVote(pageantId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["audience", "transactions"] }),
  });
}

export function useVoteStatus(voteId: string) {
  return useQuery({
    queryKey: ["audience", "votes", voteId],
    queryFn: () => audienceApi.getVoteStatus(voteId),
    enabled: !!voteId,
    refetchInterval: 5_000, // poll every 5s while waiting for payment confirmation
  });
}

export function useAudienceTransactions(query?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ["audience", "transactions", query],
    queryFn: () => audienceApi.listTransactions(query),
  });
}
