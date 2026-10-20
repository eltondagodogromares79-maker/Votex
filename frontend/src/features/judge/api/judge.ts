import { api } from "@/src/lib/api/client";
import type {
  CandidateResponse,
  CategoryResponse,
  CriterionResponse,
  RoundResponse,
} from "@/src/types";
import type { BackendAssignedPageantResponse } from "@/src/types/backend-contracts";

const base = "/api/v1/judge";

export interface JudgeScoringCriterion {
  roundCriterionId: string;
  criterionId: string;
  name: string;
  description: string | null;
  minimumScore: string;
  maximumScore: string;
  weightPercentage: string;
  displayOrder: number;
}

export interface JudgeSavedScore {
  roundCriterionId: string;
  rawScore: string;
}

export interface JudgeScoringCandidate {
  id: string;
  contestantNumber: number;
  displayName: string;
  gender: string | null;
  photoUrl: string | null;
  biography: string | null;
  submissionStatus: "DRAFT" | "SUBMITTED" | "LOCKED" | "VOIDED" | null;
  scores: JudgeSavedScore[];
}

export interface JudgeCategoryScoringWorkspace {
  roundId: string;
  roundName: string;
  categoryId: string;
  categoryName: string;
  eligibilityScope: string;
  criteria: JudgeScoringCriterion[];
  candidates: JudgeScoringCandidate[];
}

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

  getCategoryScoring: async (pageantId: string, roundId: string, categoryId: string): Promise<JudgeCategoryScoringWorkspace> => {
    const res = await api.get(`${base}/pageants/${pageantId}/rounds/${roundId}/categories/${categoryId}/scoring`);
    return res.data;
  },

  saveCategoryScoreDraft: async (pageantId: string, roundId: string, categoryId: string, contestantId: string, scores: { roundCriterionId: string; rawScore: string }[]) => {
    const res = await api.put(`${base}/pageants/${pageantId}/rounds/${roundId}/categories/${categoryId}/contestants/${contestantId}/scores`, { scores });
    return res.data as { contestantId: string; status: "DRAFT"; savedAt: string };
  },

  submitCategoryScores: async (pageantId: string, roundId: string, categoryId: string) => {
    const res = await api.post(`${base}/pageants/${pageantId}/rounds/${roundId}/categories/${categoryId}/submit`);
    return res.data as { categoryId: string; status: "SUBMITTED"; candidateCount: number; submittedAt: string };
  },
};
