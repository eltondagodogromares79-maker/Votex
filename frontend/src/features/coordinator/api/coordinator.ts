import { api } from "@/src/lib/api/client";
import type {
  PageantResponse,
  UpdatePageantRequest,
  CandidateResponse,
  AddCandidateRequest,
  CandidatePlacements,
  CategoryResponse,
  CriterionResponse,
  CreateCategoryRequest,
  CreateCriterionRequest,
  RoundJudgingConfiguration,
  RoundResponse,
  CreateRoundRequest,
  UpdateRoundRequest,
  PageantStaffResponse,
  AssignPageantStaffRequest,
  CoordinatorResourceLimits,
} from "@/src/types";

export interface CoordinatorLeaderboardEntry {
  contestantId: string;
  contestantNumber: number;
  contestantName: string;
  gender: string | null;
  photoUrl: string | null;
  categoryId: string | null;
  categoryName: string | null;
  eligibilityScope: string | null;
  categoryWeight: string | null;
  score: string | null;
  submittedJudges: number;
}

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

  getResourceLimits: async (pageantId: string): Promise<CoordinatorResourceLimits> => {
    const res = await api.get(`${base}/pageants/${pageantId}/resource-limits`);
    return res.data;
  },

  getLeaderboard: async (pageantId: string, roundId: string): Promise<CoordinatorLeaderboardEntry[]> => {
    const res = await api.get(`${base}/pageants/${pageantId}/rounds/${roundId}/leaderboard`);
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
  activateJudge: async (pageantId: string, userId: string): Promise<void> => {
    await api.post(`${base}/pageants/${pageantId}/judges/${userId}/activate`);
  },
  deleteJudgeAssignment: async (pageantId: string, userId: string): Promise<void> => {
    await api.delete(`${base}/pageants/${pageantId}/judges/${userId}/permanent`);
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
  activateTabulator: async (pageantId: string, userId: string): Promise<void> => {
    await api.post(`${base}/pageants/${pageantId}/tabulators/${userId}/activate`);
  },
  deleteTabulatorAssignment: async (pageantId: string, userId: string): Promise<void> => {
    await api.delete(`${base}/pageants/${pageantId}/tabulators/${userId}/permanent`);
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
  getContestantPlacements: async (pageantId: string, contestantId: string): Promise<CandidatePlacements> => {
    const res = await api.get(`${base}/pageants/${pageantId}/contestants/${contestantId}/placements`);
    return res.data;
  },
  saveContestantPlacements: async (pageantId: string, contestantId: string, data: CandidatePlacements): Promise<CandidatePlacements> => {
    const res = await api.put(`${base}/pageants/${pageantId}/contestants/${contestantId}/placements`, data);
    return res.data;
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
  activateCategory: async (pageantId: string, categoryId: string): Promise<void> => {
    await api.post(`${base}/pageants/${pageantId}/categories/${categoryId}/activate`);
  },
  updateCategoryStatus: async (pageantId: string, categoryId: string, status: CategoryResponse["status"]): Promise<{ status: CategoryResponse["status"] }> => {
    const res = await api.patch(`${base}/pageants/${pageantId}/categories/${categoryId}`, { status });
    return res.data;
  },

  // ─── Criteria ──────────────────────────────────────────────────────────────

  // GET /api/v1/coordinator/pageants/:pageantId/criteria
  listCriteria: async (pageantId: string): Promise<CriterionResponse[]> => {
    const res = await api.get(`${base}/pageants/${pageantId}/criteria`);
    return res.data;
  },

  getRoundJudgingConfiguration: async (pageantId: string, roundId: string): Promise<RoundJudgingConfiguration> => {
    const res = await api.get(`${base}/pageants/${pageantId}/rounds/${roundId}/judging-configuration`);
    return res.data;
  },
  saveRoundJudgingConfiguration: async (pageantId: string, roundId: string, data: RoundJudgingConfiguration): Promise<RoundJudgingConfiguration> => {
    const res = await api.put(`${base}/pageants/${pageantId}/rounds/${roundId}/judging-configuration`, data);
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
  activateCriterion: async (pageantId: string, criterionId: string): Promise<void> => {
    await api.post(`${base}/pageants/${pageantId}/criteria/${criterionId}/activate`);
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
