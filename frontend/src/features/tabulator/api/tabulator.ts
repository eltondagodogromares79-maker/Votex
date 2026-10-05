import { api } from "@/src/lib/api/client";
import type {
  CandidateResponse,
  CategoryResponse,
  CriterionResponse,
  RoundResponse,
} from "@/src/types";
import type {
  BackendAssignedPageantResponse,
  BackendAdvancementResponse,
} from "@/src/types/backend-contracts";

const base = "/api/v1/tabulator";

export const tabulatorApi = {

  // GET /api/v1/tabulator/pageants
  listPageants: async (): Promise<BackendAssignedPageantResponse[]> => {
    const res = await api.get(`${base}/pageants`);
    return res.data;
  },

  // GET /api/v1/tabulator/pageants/:pageantId/contestants
  listContestants: async (pageantId: string): Promise<CandidateResponse[]> => {
    const res = await api.get(`${base}/pageants/${pageantId}/contestants`);
    return res.data;
  },

  // GET /api/v1/tabulator/pageants/:pageantId/categories
  listCategories: async (pageantId: string): Promise<CategoryResponse[]> => {
    const res = await api.get(`${base}/pageants/${pageantId}/categories`);
    return res.data;
  },

  // GET /api/v1/tabulator/pageants/:pageantId/criteria
  listCriteria: async (pageantId: string): Promise<CriterionResponse[]> => {
    const res = await api.get(`${base}/pageants/${pageantId}/criteria`);
    return res.data;
  },

  // GET /api/v1/tabulator/pageants/:pageantId/rounds
  listRounds: async (pageantId: string): Promise<RoundResponse[]> => {
    const res = await api.get(`${base}/pageants/${pageantId}/rounds`);
    return res.data;
  },

  // GET /api/v1/tabulator/pageants/:pageantId/rounds/:roundId/advancements
  listAdvancements: async (pageantId: string, roundId: string): Promise<BackendAdvancementResponse[]> => {
    const res = await api.get(`${base}/pageants/${pageantId}/rounds/${roundId}/advancements`);
    return res.data;
  },
};
