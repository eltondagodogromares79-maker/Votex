import { useQuery } from "@tanstack/react-query";
import { orgOwnerApi } from "../api/orgOwner";

export function useActivityLogs(orgId: string, offset: number, success?: boolean) {
  return useQuery({
    queryKey: ["org_owner", orgId, "activity-logs", offset, success],
    queryFn: () => orgOwnerApi.listActivityLogs(orgId, { limit: 50, offset, success }),
    enabled: !!orgId,
  });
}
