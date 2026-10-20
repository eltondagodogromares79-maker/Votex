import { api } from "@/src/lib/api/client";

export interface PublicPageant {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  eventDate: string | null;
  venue: string | null;
  status: "PUBLISHED" | "ONGOING" | "COMPLETED" | string;
  contestantCount: number;
}

export interface PublicContestant {
  id: string;
  contestantNumber: number;
  displayName: string;
  gender: string | null;
  photoUrl: string | null;
  biography: string | null;
}

export interface PublicPageantDetails {
  pageant: PublicPageant;
  contestants: PublicContestant[];
}

export interface PublicSubscriptionPlan {
  id: string;
  code: string;
  name: string;
  kind: "ONE_TIME" | "PREMIUM" | "CUSTOM" | string;
  priceAmount: number | string;
  currency: string;
  billingIntervalMonths: number | null;
  maxPageants: number | null;
  maxTabulatorUsers: number | null;
  maxJudgesPerPageant: number | null;
  maxRoundsPerPageant: number | null;
  maxCategoriesPerRound: number | null;
  publicVotingEnabled: boolean;
  customizationEnabled: boolean;
}

export interface PublicLegalPolicy {
  slug: "terms" | "privacy" | "refund-policy" | "cookie-policy";
  title: string;
  intro: string;
  body: string;
  version: number;
  updatedAt: string;
}

export const publicCatalogApi = {
  getLegalPolicy: async (slug: PublicLegalPolicy["slug"]): Promise<PublicLegalPolicy> => {
    const response = await api.get<PublicLegalPolicy>(`/api/v1/audience/public/legal-policies/${slug}`);
    return response.data;
  },
  listPageants: async (): Promise<PublicPageant[]> => {
    const response = await api.get<PublicPageant[]>("/api/v1/audience/public/pageants");
    return response.data;
  },
  getPageant: async (slug: string): Promise<PublicPageantDetails> => {
    const response = await api.get<PublicPageantDetails>(`/api/v1/audience/public/pageants/${encodeURIComponent(slug)}`);
    return response.data;
  },
  listPlans: async (): Promise<PublicSubscriptionPlan[]> => {
    const response = await api.get<PublicSubscriptionPlan[]>("/api/v1/audience/public/subscription-plans");
    return response.data;
  },
};
