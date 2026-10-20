/**
 * Pageant types.
 *
 * Source of truth: backend domain models in
 *   src/domain/models/pageants.rs
 *
 * Naming rules:
 *   • Enum variants: snake_case strings  (#[serde(rename_all = "snake_case")])
 *   • Struct fields in API responses: camelCase  (#[serde(rename_all = "camelCase")])
 *   • Timestamps: RFC 3339 strings
 *   • UUIDs: plain string
 *
 * Pagination uses camelCase (perPage, not per_page) to match the backend
 * contract's #[serde(rename_all = "camelCase")] on PaginatedResponse<T>.
 */

// ─── Enums ────────────────────────────────────────────────────────────────────

/**
 * pageants.rs PageantStatus — DB type `pageant_status`
 * Variants: Draft | Configuring | Ready | Live | Paused | Completed | Archived
 * Serialised as snake_case lowercase strings.
 */
export type PageantStatus =
  | "draft"
  | "configuring"
  | "ready"
  | "live"
  | "paused"
  | "completed"
  | "archived";

/**
 * pageants.rs PageantMemberStatus — DB type `pageant_member_status`
 * Variants: Invited | Active | Suspended | Removed
 */
export type PageantMemberStatus =
  | "invited"
  | "active"
  | "suspended"
  | "removed";

// ─── Domain models (camelCase as returned by API) ────────────────────────────

/**
 * pageants.rs Pageant struct.
 * Fields: id, organization_id, name, slug, description, status,
 *         starts_at, ends_at, timezone, settings (Json), created_at, updated_at
 * Note: `settings` is an opaque JSON blob; typed as Record<string, unknown>.
 */
export interface Pageant {
  id: string;
  organizationId: string;
  createdBy: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  eventDate: string | null;
  startTime: string | null;
  endTime: string | null;
  venue: string | null;
  status: string;
  isPublic: boolean;
}

/**
 * pageants.rs PageantMember struct.
 * Junction between a User and a Pageant, with a Role.
 */
export interface PageantMember {
  id: string;
  pageantId: string;
  userId: string;
  roleId: string;
  status: PageantMemberStatus;
  invitedAt: string | null;
  joinedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * pageants.rs PageantInvitation struct.
 * An email-based invitation to join a pageant.
 * codeHash is skip_serializing — never returned to the client.
 */
export interface PageantInvitation {
  id: string;
  pageantId: string;
  email: string;
  roleId: string;
  invitedByUserId: string;
  // codeHash never exposed
  expiresAt: string;
  acceptedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
}

// ─── API Contract types ────────────────────────────────────────────────────────

/**
 * Response from GET /api/v1/pageants/:id
 * and items in GET /api/v1/organizations/:org_id/pageants
 *
 * `settings` is omitted from the public response in most handlers;
 * kept optional here to accommodate both shapes.
 */
export interface PageantResponse {
  id: string;
  organizationId: string;
  organizationName?: string;
  createdBy: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  eventDate: string | null;
  startTime: string | null;
  endTime: string | null;
  venue: string | null;
  status: string;
  isPublic: boolean;
}

/** Response from GET /api/v1/organizations/:orgId/pageants. */
export type PageantListResponse = PageantResponse[];

/** POST /api/v1/organizations/:org_id/pageants — request body */
export interface CreatePageantRequest {
  name: string;
  slug: string;
  description?: string | null;
  logoUrl?: string | null;
  eventDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  venue?: string | null;
  isPublic?: boolean;
}

/** PATCH /api/v1/pageants/:id — request body */
export interface UpdatePageantRequest {
  name: string;
  slug: string;
  description?: string | null;
  logoUrl?: string | null;
  eventDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  venue?: string | null;
  isPublic: boolean;
}

/** PATCH /api/v1/pageants/:id/status — request body */
export interface UpdatePageantStatusRequest {
  status: PageantStatus;
}

// ─── Pagination ────────────────────────────────────────────────────────────────

/** Generic paginated list response — camelCase to match #[serde(rename_all = "camelCase")] */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
}

/** Query params for paginated list endpoints */
export interface PaginationParams {
  page?: number;
  perPage?: number;
}
