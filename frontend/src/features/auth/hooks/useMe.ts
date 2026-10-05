import { useQuery } from "@tanstack/react-query";
import { authApi } from "../api/authentication";

export const ME_QUERY_KEY = ["auth", "me"] as const;

export function useMe() {
  return useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: () => authApi.me(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });
}
