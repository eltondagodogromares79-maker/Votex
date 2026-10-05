import { useQuery } from "@tanstack/react-query";
import { orgOwnerApi } from "../api/orgOwner";

export function useVoteRevenue(orgId: string, query?: { pageantId?: string; from?: string; to?: string }) {
  return useQuery({
    queryKey: ["org_owner", orgId, "revenue", "votes", query],
    queryFn: () => orgOwnerApi.getVoteRevenue(orgId, query),
    enabled: !!orgId,
  });
}

export function useTransactions(orgId: string, query?: { pageantId?: string; limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ["org_owner", orgId, "transactions", query],
    queryFn: () => orgOwnerApi.listTransactions(orgId, query),
    enabled: !!orgId,
  });
}
