/**
 * Organization types.
 *
 * Source of truth: backend/core_auth/src/domain/models/
 *   organization.rs
 *   organization_members.rs
 *   organization_member_roles.rs
 *
 * These are the internal domain structs — they have no serde attributes and
 * are NOT directly returned by the API (the API returns dedicated response DTOs).
 * They are kept here as reference models for the admin directory endpoint.
 */

// ─── Domain models (internal — not directly serialised by most endpoints) ─────

/** core_auth domain/models/organization.rs Organization */
export interface Organization {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** core_auth domain/models/organization_members.rs OrganizationMember */
export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  isActive: boolean;
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
}

/** core_auth domain/models/organization_member_roles.rs OrganizationMemberRole */
export interface OrganizationMemberRole {
  id: string;
  organizationMemberId: string;
  roleId: string;
  assignedBy: string | null;
  createdAt: string;
}

// ─── API response DTOs ────────────────────────────────────────────────────────

/**
 * Nested owner object inside AdminOrganizationResponse.
 * Source: portals/admin/src/contracts/directory.rs OrganizationOwnerResponse.
 */
export interface OrganizationOwnerResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
}

/**
 * portals/admin/src/contracts/directory.rs AdminOrganizationSubscriptionResponse.
 * Nested inside AdminOrganizationResponse.
 */
export interface AdminOrganizationSubscriptionResponse {
  planName: string;
  planCode: string;
  status: string;
}

/**
 * portals/admin/src/contracts/directory.rs AdminOrganizationResponse.
 * Returned by GET /api/v1/admin/organizations and GET /api/v1/admin/organizations/:id.
 */
export interface AdminOrganizationResponse {
  id: string;
  owner: OrganizationOwnerResponse;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  isActive: boolean;
  subscription: AdminOrganizationSubscriptionResponse | null;
  createdAt: string;
}
