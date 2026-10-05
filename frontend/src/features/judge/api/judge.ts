import { api } from "@/src/lib/api/client";
import type {
  CandidateResponse,
  CategoryResponse,
  CriterionResponse,
  RoundResponse,
} from "@/src/types";
import type { BackendAssignedPageantResponse } from "@/src/types/backend-contracts";

const base = "/api/v1/judge";

export const judgeApi = {

  // GET /api/v1/judge/pageants
  listPageants: async (): Promise<BackendAssignedPageantResponse[]> => {
    const res = await api.get(`${base}/pageants`);
    return res.data;
  },

  // GET /api/v1/judge/pageants/:pageantId/contestants
  listContestants: async (pageantId: string): Promise<CandidateResponse[]> => {
    const res = await api.get(`${base}/pageants/${pageantId}/contestants`);
    return res.data;
  },

  // GET /api/v1/judge/pageants/:pageantId/rounds
  listRounds: async (pageantId: string): Promise<RoundResponse[]> => {
    const res = await api.get(`${base}/pageants/${pageantId}/rounds`);
    return res.data;
  },

  // GET /api/v1/judge/pageants/:pageantId/categories
  listCategories: async (pageantId: string): Promise<CategoryResponse[]> => {
    const res = await api.get(`${base}/pageants/${pageantId}/categories`);
    return res.data;
  },

  // GET /api/v1/judge/pageants/:pageantId/criteria
  listCriteria: async (pageantId: string): Promise<CriterionResponse[]> => {
    const res = await api.get(`${base}/pageants/${pageantId}/criteria`);
    return res.data;
  },
};
