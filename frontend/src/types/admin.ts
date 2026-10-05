/**
 * Admin portal types.
 *
 * Source of truth: backend/portals/admin/src/contracts/
 *   directory.rs
 *   subscription_plans.rs
 *   revenue.rs
 *   activity_logs.rs
 *
 * The HTTP client converts snake_case ↔ camelCase transparently.
 * Decimal fields serialize as numeric strings — typed as string.
 */

// ─── Pagination ───────────────────────────────────────────────────────────────

/**
 * portals/admin/src/contracts/directory.rs DirectoryPage<T>.
 * Used by user and organization list endpoints.
 */
export interface DirectoryPage<T> {
  items: T[];
  limit: number;
  offset: number;
}

/**
 * portals/admin/src/contracts/activity_logs.rs LogPage<T>.
 * Used by audit log and transaction log endpoints.
 */
export interface LogPage<T> {
  items: T[];
  limit: number;
  offset: number;
}

// ─── Users ────────────────────────────────────────────────────────────────────

/**
 * portals/admin/src/contracts/directory.rs AdminUserResponse.
 * Returned by GET /api/v1/admin/users.
 */
export interface AdminUserResponse {
  id: string;
  email: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  phone: string | null;
  profileImageUrl: string | null;
  status: string;                  // "Pending" | "Active" | "Suspended" | "Deactivated"
  role: string;                    // "admin" | "org_owner" | "coordinator" | "judge" | "tabulator" | "audience" | "unknown"
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
}

export type AdminUserListResponse = DirectoryPage<AdminUserResponse>;

// ─── Organizations ────────────────────────────────────────────────────────────

/**
 * portals/admin/src/contracts/directory.rs AdminOrganizationResponse.
 * Returned by GET /api/v1/admin/organizations.
 * Note: imports AdminOrganizationResponse from organization.ts to avoid duplication.
 */
export type { AdminOrganizationResponse } from "./organization";
export type AdminOrganizationListResponse = DirectoryPage<import("./organization").AdminOrganizationResponse>;

// ─── Pageants ─────────────────────────────────────────────────────────────────

/**
 * portals/admin/src/contracts/directory.rs AdminPageantResponse.
 * Returned by GET /api/v1/admin/pageants.
 */
export interface AdminPageantResponse {
  id: string;
  organizationId: string;
  organizationName: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  eventDate: string | null;
  startTime: string | null;
  endTime: string | null;
  venue: string | null;
  status: string;           // DRAFT | PUBLISHED | ONGOING | COMPLETED | CANCELLED | ARCHIVED
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AdminPageantListResponse = DirectoryPage<AdminPageantResponse>;

// ─── Subscription plans ───────────────────────────────────────────────────────

/**
 * portals/admin/src/contracts/subscription_plans.rs SubscriptionPlanKind.
 * serde: rename_all = "SCREAMING_SNAKE_CASE"
 */
export type SubscriptionPlanKind =
  | "ONE_TIME"
  | "PREMIUM"
  | "CUSTOM";

/**
 * portals/admin/src/contracts/subscription_plans.rs SubscriptionPlanResponse.
 * Returned by GET /api/v1/admin/subscription-plans.
 */
export interface SubscriptionPlanResponse {
  id: string;
  code: string;
  name: string;
  kind: SubscriptionPlanKind;
  priceAmount: string;             // Decimal → string
  currency: string;
  billingIntervalMonths: number | null;
  maxPageants: number | null;
  maxTabulatorUsers: number | null;
  maxJudgesPerPageant: number | null;
  maxRoundsPerPageant: number | null;
  maxCategoriesPerRound: number | null;
  publicVotingEnabled: boolean;
  customizationEnabled: boolean;
  isActive: boolean;
}

/** POST/PUT /api/v1/admin/subscription-plans — request body. */
export interface SubscriptionPlanRequest {
  code: string;
  name: string;
  kind: SubscriptionPlanKind;
  priceAmount: string;             // Decimal → string
  currency: string;
  billingIntervalMonths?: number | null;
  maxPageants?: number | null;
  maxTabulatorUsers?: number | null;
  maxJudgesPerPageant?: number | null;
  maxRoundsPerPageant?: number | null;
  maxCategoriesPerRound?: number | null;
  publicVotingEnabled?: boolean;
  customizationEnabled?: boolean;
  isActive?: boolean;
}

// ─── Revenue ──────────────────────────────────────────────────────────────────

/**
 * portals/admin/src/contracts/revenue.rs RevenueTotalResponse.
 */
export interface RevenueTotalResponse {
  currency: string;
  amount: string;                  // Decimal → string
  completedTransactions: number;
}

/**
 * portals/admin/src/contracts/revenue.rs OrganizationRevenueResponse.
 */
export interface OrganizationRevenueResponse {
  organizationId: string;
  organizationName: string;
  currency: string;
  amount: string;                  // Decimal → string
  completedTransactions: number;
}

/**
 * portals/admin/src/contracts/revenue.rs RevenueReportResponse.
 * Returned by GET /api/v1/admin/revenue.
 */
export interface RevenueReportResponse {
  basis: string;
  totalsByCurrency: RevenueTotalResponse[];
  organizations: OrganizationRevenueResponse[];
}

// ─── Audit logs ───────────────────────────────────────────────────────────────

/**
 * portals/admin/src/contracts/activity_logs.rs AuditLogResponse.
 */
export interface AuditLogResponse {
  id: string;
  organizationId: string | null;
  organizationName: string | null;
  pageantId: string | null;
  actorUserId: string | null;
  actorEmail: string | null;
  actorName: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  beforeData: unknown | null;
  afterData: unknown | null;
  requestId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  success: boolean;
  failureReason: string | null;
  createdAt: string;
}

export type AuditLogListResponse = LogPage<AuditLogResponse>;

/**
 * portals/admin/src/contracts/activity_logs.rs TransactionLogResponse.
 */
export interface TransactionLogResponse {
  id: string;
  transactionType: string;
  organizationId: string | null;
  organizationName: string | null;
  pageantId: string | null;
  actorUserId: string | null;
  actorEmail: string | null;
  actorName: string | null;
  referenceType: string | null;
  referenceId: string | null;
  status: string;
  amount: string | null;           // Decimal → string
  currency: string | null;
  metadata: Record<string, unknown>;
  requestId: string | null;
  createdAt: string;
  completedAt: string | null;
}

export type TransactionLogListResponse = LogPage<TransactionLogResponse>;
