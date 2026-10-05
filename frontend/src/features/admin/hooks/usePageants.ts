import { useQuery } from "@tanstack/react-query";
import { adminApi, type DirectoryQuery } from "../api/admin";

export function useAdminPageants(query?: DirectoryQuery) {
  return useQuery({
    queryKey: ["admin", "pageants", query],
    queryFn: () => adminApi.listPageants(query),
  });
}

export function useAdminPageant(id: string) {
  return useQuery({
    queryKey: ["admin", "pageants", id],
    queryFn: () => adminApi.getPageant(id),
    enabled: !!id,
  });
}
