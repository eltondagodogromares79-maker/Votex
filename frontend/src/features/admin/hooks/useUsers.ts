import { useQuery } from "@tanstack/react-query";
import { adminApi, type DirectoryQuery } from "../api/admin";

export const USERS_QUERY_KEY = (query?: DirectoryQuery) =>
  ["admin", "users", query] as const;

export function useUsers(query?: DirectoryQuery) {
  return useQuery({
    queryKey: USERS_QUERY_KEY(query),
    queryFn: () => adminApi.listUsers(query),
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ["admin", "users", id],
    queryFn: () => adminApi.getUser(id),
    enabled: !!id,
  });
}
