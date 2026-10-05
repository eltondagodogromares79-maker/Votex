import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../api/admin";

export function useRevenue(query?: { organizationId?: string; from?: string; to?: string }) {
  return useQuery({
    queryKey: ["admin", "revenue", query],
    queryFn: () => adminApi.getRevenue(query),
  });
}
