/**
 * Org-owner portal types.
 *
 * Source of truth: backend/portals/org_owner/src/contracts/
 *   coordinators.rs
 *   pageant_staff.rs
 *   subscriptions.rs  (domain: org_owner/src/domain/subscription.rs)
 *   transactions.rs
 *   vote_revenue.rs
 *
 * No fictional /org-owner/context or dashboard endpoint exists in the backend.
 * The HTTP client converts snake_case ↔ camelCase transparently.
 * Decimal fields from rust_decimal serialize as numeric strings — typed as string.
 */

// ─── Coordinators ─────────────────────────────────────────────────────────────

/**
 * portals/org_owner/src/contracts/coordinators.rs CoordinatorResponse.
 * Returned by coordinator CRUD endpoints.
 */
export interface CoordinatorResponse {
  organizationId: string;
  userId: string;
  role: "ORG_COORDINATOR";
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
}

/** POST /api/v1/organizations/:id/coordinators — request body. */
export interface CreateCoordinatorRequest {
  email: string;
  firstName: string;
  lastName: string;
}

// ─── Pageant staff ────────────────────────────────────────────────────────────

/**
 * portals/org_owner/src/contracts/pageant_staff.rs PageantStaffResponse.
 * Returned by judge/tabulator/coordinator assignment endpoints.
 */
export interface PageantStaffResponse {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "PAGEANT_COORDINATOR" | "PAGEANT_JUDGE" | "PAGEANT_TABULATOR";
  isActive: boolean;
}

/** POST /api/v1/organizations/:oid/pageants/:pid/judges|tabulators|coordinators */
export interface AssignPageantStaffRequest {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  confirmCrossOrganizationReuse?: boolean;
}

// ─── Subscriptions ────────────────────────────────────────────────────────────

export interface OrganizationProfile {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  logoUrl: string | null;
}

export interface UpdateOrganizationProfileRequest {
  name: string;
  slug: string;
  description: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  logoUrl: string | null;
}

/**
 * org_owner/src/domain/subscription.rs AvailablePlan.
 * Returned by GET /api/v1/organizations/:id/subscription-plans.
 * Decimal fields (priceAmount) serialize as numeric strings.
 */
export interface AvailablePlan {
  id: string;
  code: string;
  name: string;
  kind: string;
  priceAmount: string;             // rust_decimal::Decimal → string
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

export interface PageantResourceUsage {
  pageantId: string;
  pageantName: string;
  judgesUsed: number;
  roundsUsed: number;
  categoriesUsed: number;
}

export interface OrganizationPlanUsage {
  planName: string | null;
  subscriptionStatus: string | null;
  hasCreatedPageant: boolean;
  pageantsUsed: number;
  maxPageants: number | null;
  tabulatorUsersUsed: number;
  maxTabulatorUsers: number | null;
  maxJudgesPerPageant: number | null;
  maxRoundsPerPageant: number | null;
  maxCategoriesPerRound: number | null;
  pageants: PageantResourceUsage[];
}

export interface OrganizationActivityLog {
  id: string;
  organizationId: string | null;
  pageantId: string | null;
  actorUserId: string | null;
  actorEmail: string | null;
  actorName: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  beforeData: Record<string, unknown> | null;
  afterData: Record<string, unknown> | null;
  requestId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  success: boolean;
  failureReason: string | null;
  createdAt: string;
}

export interface OrganizationActivityLogPage {
  items: OrganizationActivityLog[];
  limit: number;
  offset: number;
}

/**
 * org_owner/src/domain/subscription.rs OrganizationSubscription.
 * Returned by GET /api/v1/organizations/:id/subscription.
 */
export interface OrganizationSubscription {
  id: string;
  organizationId: string;
  planId: string;
  planCode: string;
  planName: string;
  status: string;
  priceAmount: string;             // Decimal → string
  currency: string;
  startsAt: string;
  endsAt: string | null;
  createdAt: string;
  paymentTransactionId: string | null;
  checkoutUrl: string | null;
}

export type ManualPaymentMethod = "GCASH" | "MAYA" | "MARIBANK";

export interface SubscriptionPaymentProof {
  id: string;
  subscriptionId: string;
  organizationId: string;
  organizationName: string;
  planName: string;
  amount: string;
  amountPaid: string;
  currency: string;
  paymentMethod: ManualPaymentMethod;
  referenceNumber: string;
  proofUrl: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "REVOKED";
  submittedAt: string;
  reviewedAt: string | null;
  reviewNote: string | null;
  revokedAt: string | null;
  revocationNote: string | null;
}

export interface PendingSubscriptionPayment {
  subscription: OrganizationSubscription;
  latestProof: SubscriptionPaymentProof | null;
}

export interface AdminSubscriptionPayment {
  id: string;
  amount: string;
  currency: string;
  status: string;
  paymentMethod: string | null;
  referenceNumber: string | null;
  createdAt: string;
  paidAt: string | null;
}

export interface AdminSubscriptionAction {
  id: string;
  action: string;
  reason: string | null;
  adminName: string;
  createdAt: string;
}

export interface AdminSubscriptionDetails {
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  ownerUserId: string;
  ownerFirstName: string;
  ownerLastName: string;
  ownerEmail: string;
  subscription: OrganizationSubscription | null;
  payment: AdminSubscriptionPayment | null;
  proof: SubscriptionPaymentProof | null;
  actions: AdminSubscriptionAction[];
}

export interface SubmitPaymentProofRequest {
  paymentMethod: ManualPaymentMethod;
  referenceNumber: string;
  amountPaid: number;
  proofUrl?: string | null;
}

export interface ReviewPaymentProofRequest {
  approved: boolean;
  note: string | null;
}

export interface RevokePaymentApprovalRequest {
  reason: string;
}

/** POST /api/v1/organizations/:id/subscriptions — request body. */
export interface SubscribeRequest {
  planId: string;
  paymentMethod?: ManualPaymentMethod;
  referenceNumber?: string;
  amountPaid?: number;
  proofUrl?: string | null;
}

// ─── Transactions ─────────────────────────────────────────────────────────────

/**
 * portals/org_owner/src/contracts/transactions.rs OrganizationTransaction.
 * Items in TransactionHistoryResponse.
 */
export interface OrganizationTransaction {
  id: string;
  source: string;
  transactionType: string;
  referenceId: string | null;
  description: string;
  pageantId: string | null;
  pageantName: string | null;
  candidateId: string | null;
  candidateName: string | null;
  amount: string | null;           // Decimal → string
  currency: string | null;
  status: string;
  provider: string | null;
  providerTransactionId: string | null;
  createdAt: string;
  completedAt: string | null;
}

/**
 * portals/org_owner/src/contracts/transactions.rs TransactionHistoryResponse.
 * Returned by GET /api/v1/organizations/:id/transactions.
 */
export interface TransactionHistoryResponse {
  items: OrganizationTransaction[];
  limit: number;
  offset: number;
}

// ─── Vote revenue ─────────────────────────────────────────────────────────────

/**
 * portals/org_owner/src/contracts/vote_revenue.rs VoteRevenueTotal.
 */
export interface VoteRevenueTotal {
  currency: string;
  amount: string;                  // Decimal → string
  completedTransactions: number;
  votesSold: number;
}

/**
 * portals/org_owner/src/contracts/vote_revenue.rs PageantVoteRevenue.
 */
export interface PageantVoteRevenue {
  pageantId: string;
  pageantName: string;
  currency: string;
  amount: string;                  // Decimal → string
  completedTransactions: number;
  votesSold: number;
}

/**
 * portals/org_owner/src/contracts/vote_revenue.rs CandidateVoteRevenue.
 */
export interface CandidateVoteRevenue {
  pageantId: string;
  pageantName: string;
  candidateId: string;
  candidateName: string;
  currency: string;
  amount: string;                  // Decimal → string
  completedTransactions: number;
  votesSold: number;
}

/**
 * portals/org_owner/src/contracts/vote_revenue.rs VoteRevenueReportResponse.
 * Returned by GET /api/v1/organizations/:id/revenue/votes.
 */
export interface VoteRevenueReportResponse {
  basis: string;
  totalsByCurrency: VoteRevenueTotal[];
  pageants: PageantVoteRevenue[];
  candidates: CandidateVoteRevenue[];
}
