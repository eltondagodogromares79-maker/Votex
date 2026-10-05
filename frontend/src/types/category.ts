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
  code: string;
  name: string;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

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
