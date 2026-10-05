import { useQuery } from "@tanstack/react-query";
import { tabulatorApi } from "../api/tabulator";

export function useTabulatorPageants() {
  return useQuery({
    queryKey: ["tabulator", "pageants"],
    queryFn: () => tabulatorApi.listPageants(),
  });
}

export function useTabulatorContestants(pageantId: string) {
  return useQuery({
    queryKey: ["tabulator", "pageants", pageantId, "contestants"],
    queryFn: () => tabulatorApi.listContestants(pageantId),
    enabled: !!pageantId,
  });
}

export function useTabulatorCategories(pageantId: string) {
  return useQuery({
    queryKey: ["tabulator", "pageants", pageantId, "categories"],
    queryFn: () => tabulatorApi.listCategories(pageantId),
    enabled: !!pageantId,
  });
}

export function useTabulatorCriteria(pageantId: string) {
  return useQuery({
    queryKey: ["tabulator", "pageants", pageantId, "criteria"],
    queryFn: () => tabulatorApi.listCriteria(pageantId),
    enabled: !!pageantId,
  });
}

export function useTabulatorRounds(pageantId: string) {
  return useQuery({
    queryKey: ["tabulator", "pageants", pageantId, "rounds"],
    queryFn: () => tabulatorApi.listRounds(pageantId),
    enabled: !!pageantId,
  });
}

export function useAdvancements(pageantId: string, roundId: string) {
  return useQuery({
    queryKey: ["tabulator", "pageants", pageantId, "rounds", roundId, "advancements"],
    queryFn: () => tabulatorApi.listAdvancements(pageantId, roundId),
    enabled: !!pageantId && !!roundId,
  });
}
