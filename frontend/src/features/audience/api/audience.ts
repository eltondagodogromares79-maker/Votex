import { api } from "@/src/lib/api/client";
import type {
  VotePackage,
  VoteCandidate,
  VoteCheckout,
  StartVoteRequest,
  AudienceTransactionHistoryResponse,
} from "@/src/types";

const base = "/api/v1/audience";

export const audienceApi = {

  // GET /api/v1/audience/pageants/:pageantId/vote-packages
  listVotePackages: async (pageantId: string): Promise<VotePackage[]> => {
    const res = await api.get(`${base}/pageants/${pageantId}/vote-packages`);
    return res.data;
  },

  // GET /api/v1/audience/pageants/:pageantId/contestants
  listContestants: async (pageantId: string): Promise<VoteCandidate[]> => {
    const res = await api.get(`${base}/pageants/${pageantId}/contestants`);
    return res.data;
  },

  // POST /api/v1/audience/pageants/:pageantId/votes
  startVote: async (pageantId: string, data: StartVoteRequest): Promise<VoteCheckout> => {
    const res = await api.post(`${base}/pageants/${pageantId}/votes`, data, {
      headers: { "Idempotency-Key": crypto.randomUUID() },
    });
    return res.data;
  },

  // GET /api/v1/audience/votes/:voteId
  getVoteStatus: async (voteId: string): Promise<VoteCheckout> => {
    const res = await api.get(`${base}/votes/${voteId}`);
    return res.data;
  },

  // GET /api/v1/audience/transactions
  listTransactions: async (query?: { limit?: number; offset?: number }): Promise<AudienceTransactionHistoryResponse> => {
    const res = await api.get(`${base}/transactions`, { params: query });
    return res.data;
  },
};
