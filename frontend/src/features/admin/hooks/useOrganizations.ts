import { useQuery } from "@tanstack/react-query";
import { adminApi, type DirectoryQuery } from "../api/admin";

export const ORGANIZATIONS_QUERY_KEY = (query?: DirectoryQuery) =>
  ["admin", "organizations", query] as const;

export function useOrganizations(query?: DirectoryQuery) {
  return useQuery({
    queryKey: ORGANIZATIONS_QUERY_KEY(query),
    queryFn: () => adminApi.listOrganizations(query),
  });
}

export function useOrganization(id: string) {
  return useQuery({
    queryKey: ["admin", "organizations", id],
    queryFn: () => adminApi.getOrganization(id),
    enabled: !!id,
  });
}
