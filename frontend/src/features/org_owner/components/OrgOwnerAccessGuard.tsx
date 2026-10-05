"use client";

// Auth guard removed — no access control during development.
export default function OrgOwnerAccessGuard({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function useOrgOwnerContext() {
  return { organizationIds: [] as string[] };
}
