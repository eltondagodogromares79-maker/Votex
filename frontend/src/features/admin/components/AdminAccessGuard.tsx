"use client";

// Auth guard removed — no access control during development.
export default function AdminAccessGuard({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
