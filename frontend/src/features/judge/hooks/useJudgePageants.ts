import { useQuery } from "@tanstack/react-query";
import { judgeApi } from "../api/judge";

export function useJudgePageants() {
  return useQuery({
    queryKey: ["judge", "pageants"],
    queryFn: () => judgeApi.listPageants(),
  });
}

export function useJudgeContestants(pageantId: string, enabled = true) {
  return useQuery({
    queryKey: ["judge", "pageants", pageantId, "contestants"],
    queryFn: () => judgeApi.listContestants(pageantId),
    enabled: !!pageantId && enabled,
  });
}

export function useJudgeRounds(pageantId: string, enabled = true, refetchInterval?: number) {
  return useQuery({
    queryKey: ["judge", "pageants", pageantId, "rounds"],
    queryFn: () => judgeApi.listRounds(pageantId),
    enabled: !!pageantId && enabled,
    refetchInterval,
    refetchOnWindowFocus: true,
  });
}

export function useJudgeCategories(pageantId: string, enabled = true, refetchInterval?: number) {
  return useQuery({
    queryKey: ["judge", "pageants", pageantId, "categories"],
    queryFn: () => judgeApi.listCategories(pageantId),
    enabled: !!pageantId && enabled,
    refetchInterval,
    refetchOnWindowFocus: true,
  });
}

export function useJudgeCriteria(pageantId: string, enabled = true) {
  return useQuery({
    queryKey: ["judge", "pageants", pageantId, "criteria"],
    queryFn: () => judgeApi.listCriteria(pageantId),
    enabled: !!pageantId && enabled,
  });
}
