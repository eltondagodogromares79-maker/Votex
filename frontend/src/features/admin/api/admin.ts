import { api } from "@/src/lib/api/client";
import type {
  DirectoryPage,
  AdminUserResponse,
  AdminOrganizationResponse,
  AdminPageantResponse,
  SubscriptionPlanResponse,
  SubscriptionPlanRequest,
  RevenueReportResponse,
  AuditLogResponse,
  TransactionLogResponse,
  LogPage,
} from "@/src/types";

// ─── Directory ────────────────────────────────────────────────────────────────

export interface DirectoryQuery {
  limit?: number;
  offset?: number;
}

export const adminApi = {

  // GET /api/v1/admin/users
  listUsers: async (query?: DirectoryQuery): Promise<DirectoryPage<AdminUserResponse>> => {
    const response = await api.get("/api/v1/admin/users", { params: query });
    return response.data;
  },

  // GET /api/v1/admin/users/:id
  getUser: async (id: string): Promise<AdminUserResponse> => {
    const response = await api.get(`/api/v1/admin/users/${id}`);
    return response.data;
  },

  // GET /api/v1/admin/organizations
  listOrganizations: async (query?: DirectoryQuery): Promise<DirectoryPage<AdminOrganizationResponse>> => {
    const response = await api.get("/api/v1/admin/organizations", { params: query });
    return response.data;
  },

  // GET /api/v1/admin/organizations/:id
  getOrganization: async (id: string): Promise<AdminOrganizationResponse> => {
    const response = await api.get(`/api/v1/admin/organizations/${id}`);
    return response.data;
  },

  // ─── Pageants ────────────────────────────────────────────────────────────────

  // GET /api/v1/admin/pageants
  listPageants: async (query?: DirectoryQuery): Promise<DirectoryPage<AdminPageantResponse>> => {
    const response = await api.get("/api/v1/admin/pageants", { params: query });
    return response.data;
  },

  // GET /api/v1/admin/pageants/:id
  getPageant: async (id: string): Promise<AdminPageantResponse> => {
    const response = await api.get(`/api/v1/admin/pageants/${id}`);
    return response.data;
  },

  // ─── Subscription Plans ─────────────────────────────────────────────────────

  // GET /api/v1/admin/subscription-plans
  listSubscriptionPlans: async (): Promise<SubscriptionPlanResponse[]> => {
    const response = await api.get("/api/v1/admin/subscription-plans");
    return response.data;
  },

  // GET /api/v1/admin/subscription-plans/:id
  getSubscriptionPlan: async (id: string): Promise<SubscriptionPlanResponse> => {
    const response = await api.get(`/api/v1/admin/subscription-plans/${id}`);
    return response.data;
  },

  // POST /api/v1/admin/subscription-plans
  createSubscriptionPlan: async (data: SubscriptionPlanRequest): Promise<SubscriptionPlanResponse> => {
    const response = await api.post("/api/v1/admin/subscription-plans", data);
    return response.data;
  },

  // PUT /api/v1/admin/subscription-plans/:id
  updateSubscriptionPlan: async (id: string, data: SubscriptionPlanRequest): Promise<SubscriptionPlanResponse> => {
    const response = await api.put(`/api/v1/admin/subscription-plans/${id}`, data);
    return response.data;
  },

  // DELETE /api/v1/admin/subscription-plans/:id
  deactivateSubscriptionPlan: async (id: string): Promise<void> => {
    await api.delete(`/api/v1/admin/subscription-plans/${id}`);
  },

  // ─── Revenue ────────────────────────────────────────────────────────────────

  // GET /api/v1/admin/revenue
  getRevenue: async (query?: { organizationId?: string; from?: string; to?: string }): Promise<RevenueReportResponse> => {
    const response = await api.get("/api/v1/admin/revenue", { params: query });
    return response.data;
  },

  // ─── Audit Logs ─────────────────────────────────────────────────────────────

  // GET /api/v1/admin/audit-logs
  listAuditLogs: async (query?: Record<string, unknown>): Promise<LogPage<AuditLogResponse>> => {
    const response = await api.get("/api/v1/admin/audit-logs", { params: query });
    return response.data;
  },

  // GET /api/v1/admin/audit-logs/:id
  getAuditLog: async (id: string): Promise<AuditLogResponse> => {
    const response = await api.get(`/api/v1/admin/audit-logs/${id}`);
    return response.data;
  },

  // GET /api/v1/admin/transaction-logs
  listTransactionLogs: async (query?: Record<string, unknown>): Promise<LogPage<TransactionLogResponse>> => {
    const response = await api.get("/api/v1/admin/transaction-logs", { params: query });
    return response.data;
  },

  // GET /api/v1/admin/transaction-logs/:id
  getTransactionLog: async (id: string): Promise<TransactionLogResponse> => {
    const response = await api.get(`/api/v1/admin/transaction-logs/${id}`);
    return response.data;
  },
};
