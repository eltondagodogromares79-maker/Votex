import { api } from "@/src/lib/api/client";
import type {
  PageantResponse,
  UpdatePageantRequest,
  CandidateResponse,
  AddCandidateRequest,
  CategoryResponse,
  CriterionResponse,
  CreateCategoryRequest,
  CreateCriterionRequest,
  RoundResponse,
  CreateRoundRequest,
  UpdateRoundRequest,
  PageantStaffResponse,
  AssignPageantStaffRequest,
} from "@/src/types";

const base = "/api/v1/coordinator";

export const coordinatorApi = {

  // ─── Pageants ──────────────────────────────────────────────────────────────

  // GET /api/v1/coordinator/pageants
  listPageants: async (): Promise<PageantResponse[]> => {
    const res = await api.get(`${base}/pageants`);
    return res.data;
  },

  // GET /api/v1/coordinator/pageants/:pageantId
  getPageant: async (pageantId: string): Promise<PageantResponse> => {
    const res = await api.get(`${base}/pageants/${pageantId}`);
    return res.data;
  },

  // PUT /api/v1/coordinator/pageants/:pageantId
  updatePageant: async (pageantId: string, data: UpdatePageantRequest): Promise<PageantResponse> => {
    const res = await api.put(`${base}/pageants/${pageantId}`, data);
    return res.data;
  },

  // ─── Judges ────────────────────────────────────────────────────────────────

  // GET /api/v1/coordinator/pageants/:pageantId/judges
  listJudges: async (pageantId: string): Promise<PageantStaffResponse[]> => {
    const res = await api.get(`${base}/pageants/${pageantId}/judges`);
    return res.data;
  },

  // POST /api/v1/coordinator/pageants/:pageantId/judges
  assignJudge: async (pageantId: string, data: AssignPageantStaffRequest): Promise<PageantStaffResponse> => {
    const res = await api.post(`${base}/pageants/${pageantId}/judges`, data);
    return res.data;
  },

  // DELETE /api/v1/coordinator/pageants/:pageantId/judges/:userId
  revokeJudge: async (pageantId: string, userId: string): Promise<void> => {
    await api.delete(`${base}/pageants/${pageantId}/judges/${userId}`);
  },

  // ─── Tabulators ────────────────────────────────────────────────────────────

  // GET /api/v1/coordinator/pageants/:pageantId/tabulators
  listTabulators: async (pageantId: string): Promise<PageantStaffResponse[]> => {
    const res = await api.get(`${base}/pageants/${pageantId}/tabulators`);
    return res.data;
  },

  // POST /api/v1/coordinator/pageants/:pageantId/tabulators
  assignTabulator: async (pageantId: string, data: AssignPageantStaffRequest): Promise<PageantStaffResponse> => {
    const res = await api.post(`${base}/pageants/${pageantId}/tabulators`, data);
    return res.data;
  },

  // DELETE /api/v1/coordinator/pageants/:pageantId/tabulators/:userId
  revokeTabulator: async (pageantId: string, userId: string): Promise<void> => {
    await api.delete(`${base}/pageants/${pageantId}/tabulators/${userId}`);
  },

  // ─── Contestants ───────────────────────────────────────────────────────────

  // GET /api/v1/coordinator/pageants/:pageantId/contestants
  listContestants: async (pageantId: string): Promise<CandidateResponse[]> => {
    const res = await api.get(`${base}/pageants/${pageantId}/contestants`);
    return res.data;
  },

  // POST /api/v1/coordinator/pageants/:pageantId/contestants
  createContestant: async (pageantId: string, data: AddCandidateRequest): Promise<CandidateResponse> => {
    const res = await api.post(`${base}/pageants/${pageantId}/contestants`, data);
    return res.data;
  },

  // GET /api/v1/coordinator/pageants/:pageantId/contestants/:contestantId
  getContestant: async (pageantId: string, contestantId: string): Promise<CandidateResponse> => {
    const res = await api.get(`${base}/pageants/${pageantId}/contestants/${contestantId}`);
    return res.data;
  },

  // PUT /api/v1/coordinator/pageants/:pageantId/contestants/:contestantId
  updateContestant: async (pageantId: string, contestantId: string, data: AddCandidateRequest): Promise<CandidateResponse> => {
    const res = await api.put(`${base}/pageants/${pageantId}/contestants/${contestantId}`, data);
    return res.data;
  },

  // DELETE /api/v1/coordinator/pageants/:pageantId/contestants/:contestantId
  deactivateContestant: async (pageantId: string, contestantId: string): Promise<void> => {
    await api.delete(`${base}/pageants/${pageantId}/contestants/${contestantId}`);
  },

  // ─── Categories ────────────────────────────────────────────────────────────

  // GET /api/v1/coordinator/pageants/:pageantId/categories
  listCategories: async (pageantId: string): Promise<CategoryResponse[]> => {
    const res = await api.get(`${base}/pageants/${pageantId}/categories`);
    return res.data;
  },

  // POST /api/v1/coordinator/pageants/:pageantId/categories
  createCategory: async (pageantId: string, data: CreateCategoryRequest): Promise<CategoryResponse> => {
    const res = await api.post(`${base}/pageants/${pageantId}/categories`, data);
    return res.data;
  },

  // GET /api/v1/coordinator/pageants/:pageantId/categories/:categoryId
  getCategory: async (pageantId: string, categoryId: string): Promise<CategoryResponse> => {
    const res = await api.get(`${base}/pageants/${pageantId}/categories/${categoryId}`);
    return res.data;
  },

  // PUT /api/v1/coordinator/pageants/:pageantId/categories/:categoryId
  updateCategory: async (pageantId: string, categoryId: string, data: CreateCategoryRequest): Promise<CategoryResponse> => {
    const res = await api.put(`${base}/pageants/${pageantId}/categories/${categoryId}`, data);
    return res.data;
  },

  // DELETE /api/v1/coordinator/pageants/:pageantId/categories/:categoryId
  deactivateCategory: async (pageantId: string, categoryId: string): Promise<void> => {
    await api.delete(`${base}/pageants/${pageantId}/categories/${categoryId}`);
  },

  // ─── Criteria ──────────────────────────────────────────────────────────────

  // GET /api/v1/coordinator/pageants/:pageantId/criteria
  listCriteria: async (pageantId: string): Promise<CriterionResponse[]> => {
    const res = await api.get(`${base}/pageants/${pageantId}/criteria`);
    return res.data;
  },

  // POST /api/v1/coordinator/pageants/:pageantId/criteria
  createCriterion: async (pageantId: string, data: CreateCriterionRequest): Promise<CriterionResponse> => {
    const res = await api.post(`${base}/pageants/${pageantId}/criteria`, data);
    return res.data;
  },

  // GET /api/v1/coordinator/pageants/:pageantId/criteria/:criterionId
  getCriterion: async (pageantId: string, criterionId: string): Promise<CriterionResponse> => {
    const res = await api.get(`${base}/pageants/${pageantId}/criteria/${criterionId}`);
    return res.data;
  },

  // PUT /api/v1/coordinator/pageants/:pageantId/criteria/:criterionId
  updateCriterion: async (pageantId: string, criterionId: string, data: CreateCriterionRequest): Promise<CriterionResponse> => {
    const res = await api.put(`${base}/pageants/${pageantId}/criteria/${criterionId}`, data);
    return res.data;
  },

  // DELETE /api/v1/coordinator/pageants/:pageantId/criteria/:criterionId
  deactivateCriterion: async (pageantId: string, criterionId: string): Promise<void> => {
    await api.delete(`${base}/pageants/${pageantId}/criteria/${criterionId}`);
  },

  // ─── Rounds ────────────────────────────────────────────────────────────────

  // GET /api/v1/coordinator/pageants/:pageantId/rounds
  listRounds: async (pageantId: string): Promise<RoundResponse[]> => {
    const res = await api.get(`${base}/pageants/${pageantId}/rounds`);
    return res.data;
  },

  // POST /api/v1/coordinator/pageants/:pageantId/rounds
  createRound: async (pageantId: string, data: CreateRoundRequest): Promise<RoundResponse> => {
    const res = await api.post(`${base}/pageants/${pageantId}/rounds`, data);
    return res.data;
  },

  // GET /api/v1/coordinator/pageants/:pageantId/rounds/:roundId
  getRound: async (pageantId: string, roundId: string): Promise<RoundResponse> => {
    const res = await api.get(`${base}/pageants/${pageantId}/rounds/${roundId}`);
    return res.data;
  },

  // PUT /api/v1/coordinator/pageants/:pageantId/rounds/:roundId
  updateRound: async (pageantId: string, roundId: string, data: UpdateRoundRequest): Promise<RoundResponse> => {
    const res = await api.put(`${base}/pageants/${pageantId}/rounds/${roundId}`, data);
    return res.data;
  },

  // DELETE /api/v1/coordinator/pageants/:pageantId/rounds/:roundId
  deleteRound: async (pageantId: string, roundId: string): Promise<void> => {
    await api.delete(`${base}/pageants/${pageantId}/rounds/${roundId}`);
  },
};
