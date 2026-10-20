/**
 * Category & Criterion types.
 *
 * Source of truth: backend/portals/coordinator/src/contracts/pageant_setup.rs
 *
 * defaultMaximumScore and defaultMinimumScore are rust_decimal::Decimal,
 * serialized as numeric strings — typed as string.
 * displayOrder defaults to 0 on the backend if omitted.
 */

// ─── Category ─────────────────────────────────────────────────────────────────

/**
 * coordinator/contracts/pageant_setup.rs CategoryResponse.
 * Returned by category CRUD endpoints.
 */
export interface CategoryResponse {
  id: string;
  pageantId: string;
  roundId?: string | null;
  code: string;
  name: string;
  description: string | null;
  displayOrder: number;
  eligibilityScope: CategoryEligibilityScope;
  eligibilityNotes: string | null;
  isActive: boolean;
  status: "DRAFT" | "OPEN" | "CLOSED" | "COMPLETED";
  createdAt: string;
  updatedAt: string;
}

export type CategoryEligibilityScope = "OPEN" | "WOMEN" | "MEN" | "LGBTQ_PLUS" | "CUSTOM";

export type Category = CategoryResponse;

/**
 * coordinator/contracts/pageant_setup.rs CategoryRequest.
 * displayOrder defaults to 0 if omitted.
 */
export interface CreateCategoryRequest {
  code: string;
  name: string;
  description?: string | null;
  displayOrder?: number;
  eligibilityScope?: CategoryEligibilityScope;
  eligibilityNotes?: string | null;
  roundId?: string | null;
}

export type UpdateCategoryRequest = CreateCategoryRequest;

// ─── Criterion ────────────────────────────────────────────────────────────────

/**
 * coordinator/contracts/pageant_setup.rs CriterionResponse.
 * defaultMaximumScore / defaultMinimumScore are Decimal → string.
 */
export interface CriterionResponse {
  id: string;
  pageantId: string;
  code: string;
  name: string;
  description: string | null;
  defaultMaximumScore: string;   // Decimal → string
  defaultMinimumScore: string;   // Decimal → string
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type Criterion = CriterionResponse;

/**
 * coordinator/contracts/pageant_setup.rs CriterionRequest.
 */
export interface CreateCriterionRequest {
  code: string;
  name: string;
  description?: string | null;
  defaultMaximumScore: string;   // Decimal → string
  defaultMinimumScore: string;   // Decimal → string
}

export type UpdateCriterionRequest = CreateCriterionRequest;

export interface RoundCriterionConfig {
  criterionId: string;
  categoryId: string;
  weightPercentage: string;
  maximumScore: string;
  minimumScore: string;
  displayOrder: number;
}

export interface RoundCategoryConfig {
  categoryId: string;
  weightPercentage: string;
}

export interface RoundJudgingConfiguration {
  categoryIds: string[];
  categories: RoundCategoryConfig[];
  criteria: RoundCriterionConfig[];
}
