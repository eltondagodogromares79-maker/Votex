/**
 * Voting types.
 *
 * Source of truth: backend/portals/audience/src/contracts/
 *   voting.rs
 *   transactions.rs
 *
 * And: backend/portals/org_owner/src/contracts/vote_packages.rs
 *
 * The HTTP client converts snake_case ↔ camelCase transparently.
 * rust_decimal::Decimal fields serialize as numeric strings — typed as string.
 */

// ─── Audience voting ──────────────────────────────────────────────────────────

/**
 * audience/contracts/voting.rs VotePackageResponse (transparent over VotePackage).
 * Returned by GET /api/v1/pageants/:id/vote-packages (public).
 * priceAmount is Decimal → string.
 */
export interface VotePackage {
  id: string;
  pageantId: string;
  name: string;
  description: string | null;
  voteQuantity: number;
  priceAmount: string;   // Decimal → string
  currency: string;
}

/**
 * audience/contracts/voting.rs VoteCandidateResponse (transparent over VoteCandidate).
 * Returned by GET /api/v1/pageants/:id/candidates (public voting view).
 */
export interface VoteCandidate {
  id: string;
  contestantNumber: number;
  displayName: string;
  photoUrl: string | null;
  biography: string | null;
}

/**
 * audience/contracts/voting.rs StartVoteRequest.
 * POST /api/v1/pageants/:id/votes
 */
export interface StartVoteRequest {
  contestantId: string;
  packageId: string;
}

/**
 * audience/contracts/voting.rs VoteCheckoutResponse (transparent over VoteCheckout).
 * Returned by POST /api/v1/pageants/:id/votes and GET /api/v1/votes/:id.
 * amount is Decimal → string.
 */
export interface VoteCheckout {
  id: string;
  contestantId: string;
  packageId: string;
  quantity: number;
  amount: string;        // Decimal → string
  currency: string;
  status: string;
  checkoutUrl: string | null;
}

/**
 * audience/contracts/transactions.rs AudienceTransaction.
 * Items in AudienceTransactionHistoryResponse.
 * amount is Decimal → string.
 */
export interface AudienceTransaction {
  id: string;
  pageantId: string;
  pageantName: string;
  contestantId: string;
  contestantName: string;
  packageId: string | null;
  packageName: string | null;
  voteQuantity: number;
  amount: string;        // Decimal → string
  currency: string;
  status: string;
  providerPaymentId: string | null;
  createdAt: string;
  paidAt: string | null;
}

/**
 * audience/contracts/transactions.rs TransactionHistoryResponse.
 * Returned by GET /api/v1/audience/transactions.
 */
export interface AudienceTransactionHistoryResponse {
  items: AudienceTransaction[];
  limit: number;
  offset: number;
}

// ─── Org-owner vote packages ──────────────────────────────────────────────────

/**
 * org_owner/contracts/vote_packages.rs VotePackageResponse.
 * Returned by GET /api/v1/organizations/:oid/pageants/:pid/vote-packages.
 * Includes isActive; priceAmount is Decimal → string.
 */
export interface VotePackageResponse {
  id: string;
  pageantId: string;
  name: string;
  description: string | null;
  voteQuantity: number;
  priceAmount: string;   // Decimal → string
  currency: string;
  isActive: boolean;
}

/**
 * org_owner/contracts/vote_packages.rs CreateVotePackageRequest.
 * currency defaults to "PHP" on the backend if omitted.
 */
export interface CreateVotePackageRequest {
  name: string;
  description?: string | null;
  voteQuantity: number;
  priceAmount: string;   // Decimal → string
  currency?: string;
}

/**
 * org_owner/contracts/vote_packages.rs UpdateVotePackageRequest.
 */
export interface UpdateVotePackageRequest {
  name: string;
  description?: string | null;
  voteQuantity: number;
  priceAmount: string;   // Decimal → string
  currency: string;
}
