import { useQuery } from "@tanstack/react-query";
import { judgeApi } from "../api/judge";

export function useJudgePageants() {
  return useQuery({
    queryKey: ["judge", "pageants"],
    queryFn: () => judgeApi.listPageants(),
  });
}

export function useJudgeContestants(pageantId: string) {
  return useQuery({
    queryKey: ["judge", "pageants", pageantId, "contestants"],
    queryFn: () => judgeApi.listContestants(pageantId),
    enabled: !!pageantId,
  });
}

export function useJudgeRounds(pageantId: string) {
  return useQuery({
    queryKey: ["judge", "pageants", pageantId, "rounds"],
    queryFn: () => judgeApi.listRounds(pageantId),
    enabled: !!pageantId,
  });
}

export function useJudgeCategories(pageantId: string) {
  return useQuery({
    queryKey: ["judge", "pageants", pageantId, "categories"],
    queryFn: () => judgeApi.listCategories(pageantId),
    enabled: !!pageantId,
  });
}

export function useJudgeCriteria(pageantId: string) {
  return useQuery({
    queryKey: ["judge", "pageants", pageantId, "criteria"],
    queryFn: () => judgeApi.listCriteria(pageantId),
    enabled: !!pageantId,
  });
}
