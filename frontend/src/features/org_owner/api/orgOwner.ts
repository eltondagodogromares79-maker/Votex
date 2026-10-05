import { api } from "@/src/lib/api/client";
import type {
  PageantResponse,
  CreatePageantRequest,
  UpdatePageantRequest,
  CoordinatorResponse,
  CreateCoordinatorRequest,
  PageantStaffResponse,
  AssignPageantStaffRequest,
  VotePackageResponse,
  CreateVotePackageRequest,
  UpdateVotePackageRequest,
  AvailablePlan,
  OrganizationSubscription,
  SubscribeRequest,
  TransactionHistoryResponse,
  VoteRevenueReportResponse,
} from "@/src/types";

const base = (orgId: string) => `/api/v1/organizations/${orgId}`;

export const orgOwnerApi = {

  // ─── Pageants ──────────────────────────────────────────────────────────────

  // GET /api/v1/organizations/:orgId/pageants
  listPageants: async (orgId: string): Promise<PageantResponse[]> => {
    const res = await api.get(`${base(orgId)}/pageants`);
    return res.data;
  },

  // POST /api/v1/organizations/:orgId/pageants
  createPageant: async (orgId: string, data: CreatePageantRequest): Promise<PageantResponse> => {
    const res = await api.post(`${base(orgId)}/pageants`, data);
    return res.data;
  },

  // GET /api/v1/organizations/:orgId/pageants/:pageantId
  getPageant: async (orgId: string, pageantId: string): Promise<PageantResponse> => {
    const res = await api.get(`${base(orgId)}/pageants/${pageantId}`);
    return res.data;
  },

  // PUT /api/v1/organizations/:orgId/pageants/:pageantId
  updatePageant: async (orgId: string, pageantId: string, data: UpdatePageantRequest): Promise<PageantResponse> => {
    const res = await api.put(`${base(orgId)}/pageants/${pageantId}`, data);
    return res.data;
  },

  // DELETE /api/v1/organizations/:orgId/pageants/:pageantId
  archivePageant: async (orgId: string, pageantId: string): Promise<void> => {
    await api.delete(`${base(orgId)}/pageants/${pageantId}`);
  },

  // ─── Coordinators ──────────────────────────────────────────────────────────

  // GET /api/v1/organizations/:orgId/coordinators
  listCoordinators: async (orgId: string): Promise<CoordinatorResponse[]> => {
    const res = await api.get(`${base(orgId)}/coordinators`);
    return res.data;
  },

  // POST /api/v1/organizations/:orgId/coordinators
  addCoordinator: async (orgId: string, data: CreateCoordinatorRequest): Promise<CoordinatorResponse> => {
    const res = await api.post(`${base(orgId)}/coordinators`, data);
    return res.data;
  },

  // GET /api/v1/organizations/:orgId/coordinators/:userId
  getCoordinator: async (orgId: string, userId: string): Promise<CoordinatorResponse> => {
    const res = await api.get(`${base(orgId)}/coordinators/${userId}`);
    return res.data;
  },

  // PUT /api/v1/organizations/:orgId/coordinators/:userId
  replaceCoordinator: async (orgId: string, userId: string, data: CreateCoordinatorRequest): Promise<CoordinatorResponse> => {
    const res = await api.put(`${base(orgId)}/coordinators/${userId}`, data);
    return res.data;
  },

  // PATCH /api/v1/organizations/:orgId/coordinators/:userId
  updateCoordinator: async (
    orgId: string,
    userId: string,
    data: { email: string; firstName: string; lastName: string },
  ): Promise<CoordinatorResponse> => {
    const res = await api.patch(`${base(orgId)}/coordinators/${userId}`, data);
    return res.data;
  },

  // POST /api/v1/organizations/:orgId/coordinators/:userId/resend-credentials
  resendCoordinatorCredentials: async (orgId: string, userId: string): Promise<void> => {
    await api.post(`${base(orgId)}/coordinators/${userId}/resend-credentials`);
  },

  // DELETE /api/v1/organizations/:orgId/coordinators/:userId
  removeCoordinator: async (orgId: string, userId: string): Promise<void> => {
    await api.delete(`${base(orgId)}/coordinators/${userId}`);
  },
  // ─── Pageant Staff ─────────────────────────────────────────────────────────

  // GET /api/v1/organizations/:orgId/pageants/:pageantId/coordinators
  listPageantCoordinators: async (orgId: string, pageantId: string): Promise<PageantStaffResponse[]> => {
    const res = await api.get(`${base(orgId)}/pageants/${pageantId}/coordinators`);
    return res.data;
  },

  // POST /api/v1/organizations/:orgId/pageants/:pageantId/coordinators
  assignPageantCoordinator: async (orgId: string, pageantId: string, data: AssignPageantStaffRequest): Promise<PageantStaffResponse> => {
    const res = await api.post(`${base(orgId)}/pageants/${pageantId}/coordinators`, data);
    return res.data;
  },

  // DELETE /api/v1/organizations/:orgId/pageants/:pageantId/coordinators/:userId
  revokePageantCoordinator: async (orgId: string, pageantId: string, userId: string): Promise<void> => {
    await api.delete(`${base(orgId)}/pageants/${pageantId}/coordinators/${userId}`);
  },

  // GET /api/v1/organizations/:orgId/pageants/:pageantId/judges
  listJudges: async (orgId: string, pageantId: string): Promise<PageantStaffResponse[]> => {
    const res = await api.get(`${base(orgId)}/pageants/${pageantId}/judges`);
    return res.data;
  },

  // POST /api/v1/organizations/:orgId/pageants/:pageantId/judges
  assignJudge: async (orgId: string, pageantId: string, data: AssignPageantStaffRequest): Promise<PageantStaffResponse> => {
    const res = await api.post(`${base(orgId)}/pageants/${pageantId}/judges`, data);
    return res.data;
  },

  // DELETE /api/v1/organizations/:orgId/pageants/:pageantId/judges/:userId
  revokeJudge: async (orgId: string, pageantId: string, userId: string): Promise<void> => {
    await api.delete(`${base(orgId)}/pageants/${pageantId}/judges/${userId}`);
  },

  // GET /api/v1/organizations/:orgId/pageants/:pageantId/tabulators
  listTabulators: async (orgId: string, pageantId: string): Promise<PageantStaffResponse[]> => {
    const res = await api.get(`${base(orgId)}/pageants/${pageantId}/tabulators`);
    return res.data;
  },

  // POST /api/v1/organizations/:orgId/pageants/:pageantId/tabulators
  assignTabulator: async (orgId: string, pageantId: string, data: AssignPageantStaffRequest): Promise<PageantStaffResponse> => {
    const res = await api.post(`${base(orgId)}/pageants/${pageantId}/tabulators`, data);
    return res.data;
  },

  // DELETE /api/v1/organizations/:orgId/pageants/:pageantId/tabulators/:userId
  revokeTabulator: async (orgId: string, pageantId: string, userId: string): Promise<void> => {
    await api.delete(`${base(orgId)}/pageants/${pageantId}/tabulators/${userId}`);
  },

  // ─── Vote Packages ─────────────────────────────────────────────────────────

  // GET /api/v1/organizations/:orgId/pageants/:pageantId/vote-packages
  listVotePackages: async (orgId: string, pageantId: string): Promise<VotePackageResponse[]> => {
    const res = await api.get(`${base(orgId)}/pageants/${pageantId}/vote-packages`);
    return res.data;
  },

  // POST /api/v1/organizations/:orgId/pageants/:pageantId/vote-packages
  createVotePackage: async (orgId: string, pageantId: string, data: CreateVotePackageRequest): Promise<VotePackageResponse> => {
    const res = await api.post(`${base(orgId)}/pageants/${pageantId}/vote-packages`, data);
    return res.data;
  },

  // PUT /api/v1/organizations/:orgId/pageants/:pageantId/vote-packages/:packageId
  updateVotePackage: async (orgId: string, pageantId: string, packageId: string, data: UpdateVotePackageRequest): Promise<VotePackageResponse> => {
    const res = await api.put(`${base(orgId)}/pageants/${pageantId}/vote-packages/${packageId}`, data);
    return res.data;
  },

  // DELETE /api/v1/organizations/:orgId/pageants/:pageantId/vote-packages/:packageId
  deactivateVotePackage: async (orgId: string, pageantId: string, packageId: string): Promise<void> => {
    await api.delete(`${base(orgId)}/pageants/${pageantId}/vote-packages/${packageId}`);
  },

  // ─── Subscriptions ─────────────────────────────────────────────────────────

  // GET /api/v1/organizations/:orgId/subscription-plans
  listSubscriptionPlans: async (orgId: string): Promise<AvailablePlan[]> => {
    const res = await api.get(`${base(orgId)}/subscription-plans`);
    return res.data;
  },

  // GET /api/v1/organizations/:orgId/subscription
  getSubscription: async (orgId: string): Promise<OrganizationSubscription> => {
    const res = await api.get(`${base(orgId)}/subscription`);
    return res.data;
  },

  // GET /api/v1/organizations/:orgId/subscriptions
  listSubscriptionHistory: async (orgId: string): Promise<OrganizationSubscription[]> => {
    const res = await api.get(`${base(orgId)}/subscriptions`);
    return res.data;
  },

  // POST /api/v1/organizations/:orgId/subscriptions
  subscribe: async (orgId: string, data: SubscribeRequest): Promise<OrganizationSubscription> => {
    const res = await api.post(`${base(orgId)}/subscriptions`, data);
    return res.data;
  },

  // DELETE /api/v1/organizations/:orgId/subscriptions/:subscriptionId
  cancelSubscription: async (orgId: string, subscriptionId: string): Promise<void> => {
    await api.delete(`${base(orgId)}/subscriptions/${subscriptionId}`);
  },

  // ─── Revenue & Transactions ────────────────────────────────────────────────

  // GET /api/v1/organizations/:orgId/revenue/votes
  getVoteRevenue: async (orgId: string, query?: { pageantId?: string; from?: string; to?: string }): Promise<VoteRevenueReportResponse> => {
    const res = await api.get(`${base(orgId)}/revenue/votes`, { params: query });
    return res.data;
  },

  // GET /api/v1/organizations/:orgId/transactions
  listTransactions: async (orgId: string, query?: { pageantId?: string; limit?: number; offset?: number }): Promise<TransactionHistoryResponse> => {
    const res = await api.get(`${base(orgId)}/transactions`, { params: query });
    return res.data;
  },
};
