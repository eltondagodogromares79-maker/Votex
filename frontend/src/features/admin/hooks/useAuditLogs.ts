import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../api/admin";

export function useAuditLogs(query?: Record<string, unknown>) {
  return useQuery({
    queryKey: ["admin", "audit-logs", query],
    queryFn: () => adminApi.listAuditLogs(query),
  });
}

export function useAuditLog(id: string) {
  return useQuery({
    queryKey: ["admin", "audit-logs", id],
    queryFn: () => adminApi.getAuditLog(id),
    enabled: !!id,
  });
}

export function useTransactionLogs(query?: Record<string, unknown>) {
  return useQuery({
    queryKey: ["admin", "transaction-logs", query],
    queryFn: () => adminApi.listTransactionLogs(query),
  });
}

export function useTransactionLog(id: string) {
  return useQuery({
    queryKey: ["admin", "transaction-logs", id],
    queryFn: () => adminApi.getTransactionLog(id),
    enabled: !!id,
  });
}
