/**
 * Billing types.
 *
 * Source of truth: backend/portals/org_owner/src/
 *   domain/subscription.rs  (AvailablePlan, OrganizationSubscription)
 *   contracts/subscriptions.rs  (SubscribeRequest)
 *
 * And: backend/portals/admin/src/contracts/subscription_plans.rs
 *   (SubscriptionPlanKind — re-exported from admin.ts)
 *
 * Decimal fields (priceAmount, amount) serialize as numeric strings.
 */

// Re-export SubscriptionPlanKind so billing consumers don't need to import admin.ts
export type { SubscriptionPlanKind } from "./admin";

// ─── Status enums (string literals used in DB/API) ────────────────────────────

/**
 * Known status values for OrganizationSubscription.status.
 */
export type SubscriptionStatus =
  | "active"
  | "cancelled"
  | "expired"
  | "pending"
  | "suspended";

/**
 * Known status values for audience vote transaction status.
 */
export type PaymentStatus =
  | "pending"
  | "processing"
  | "paid"
  | "failed"
  | "cancelled"
  | "refunded"
  | "partially_refunded";

export type SubscriptionPaymentMode = "MANUAL" | "AUTOMATED";

// ─── Re-exports from org-owner (canonical location for these types) ───────────

export type {
  AvailablePlan,
  OrganizationSubscription,
  PendingSubscriptionPayment,
  SubscriptionPaymentProof,
  ManualPaymentMethod,
  SubmitPaymentProofRequest,
  ReviewPaymentProofRequest,
  RevokePaymentApprovalRequest,
  SubscribeRequest,
  TransactionHistoryResponse,
  OrganizationTransaction,
  VoteRevenueReportResponse,
  VoteRevenueTotal,
  PageantVoteRevenue,
  CandidateVoteRevenue,
} from "./org-owner";
