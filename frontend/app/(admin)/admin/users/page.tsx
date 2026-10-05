"use client";

import { useState } from "react";
import AdminPageShell from "@/src/features/admin/components/AdminPageShell";
import { useUsers } from "@/src/features/admin/hooks/useUsers";
import type { AdminUserResponse } from "@/src/types";

const PAGE_SIZE = 50;

const ROLE_LABELS: Record<string, string> = {
  admin:       "Admin",
  org_owner:   "Org Owner",
  coordinator: "Coordinator",
  judge:       "Judge",
  tabulator:   "Tabulator",
  audience:    "Audience",
  unknown:     "Unknown",
};

const ROLE_STYLES: Record<string, string> = {
  admin:       "bg-error/8 border-error/25 text-error",
  org_owner:   "bg-navy/8 border-navy/20 text-navy",
  coordinator: "bg-gold/10 border-gold/30 text-gold",
  judge:       "bg-success/8 border-success/25 text-success",
  tabulator:   "bg-purple-500/10 border-purple-500/25 text-purple-600",
  audience:    "bg-border/30 border-border text-muted",
  unknown:     "bg-border/30 border-border text-muted",
};

function RoleBadge({ role }: { role: string }) {
  const cls = ROLE_STYLES[role] ?? ROLE_STYLES.unknown;
  return (
    <span className={`inline-flex items-center h-5 px-2 text-[10px] font-semibold uppercase tracking-wider border ${cls}`}>
      {ROLE_LABELS[role] ?? role}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  const cls =
    s === "active"    ? "bg-success/8 border-success/25 text-success" :
    s === "pending"   ? "bg-gold/10 border-gold/30 text-gold" :
    s === "suspended" ? "bg-error/8 border-error/25 text-error" :
    "bg-border/30 border-border text-muted";
  return (
    <span className={`inline-flex items-center h-5 px-2 text-[10px] font-semibold uppercase tracking-wider border ${cls}`}>
      {status}
    </span>
  );
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`bg-surface border border-border animate-pulse ${className}`} />;
}

export default function AdminUsersPage() {
  const [offset,     setOffset]     = useState(0);
  const [search,     setSearch]     = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const { data, isLoading, isError } = useUsers({ limit: PAGE_SIZE, offset });
  const items: AdminUserResponse[] = data?.items ?? [];

  const filtered = items.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !search || (
      u.email.toLowerCase().includes(q) ||
      u.firstName.toLowerCase().includes(q) ||
      u.lastName.toLowerCase().includes(q)
    );
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const hasMore = data ? data.items.length === PAGE_SIZE : false;

  return (
    <AdminPageShell
      title="Users"
      subtitle="All platform users across every role."
      breadcrumbs={[{ label: "Dashboard", href: "/admin/dashboard" }, { label: "Users" }]}
    >
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none"
            fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text" placeholder="Search by name or email…" value={search}
            onChange={e => { setSearch(e.target.value); }}
            className="w-full h-9 pl-9 pr-3 bg-surface border border-border text-small text-charcoal placeholder:text-muted focus:outline-none focus:border-navy transition-colors"
          />
        </div>
        <select
          value={roleFilter}
          onChange={e => { setRoleFilter(e.target.value); setOffset(0); }}
          className="h-9 px-3 bg-surface border border-border text-small text-charcoal focus:outline-none focus:border-navy transition-colors"
        >
          <option value="">All roles</option>
          {Object.entries(ROLE_LABELS).filter(([k]) => k !== "unknown").map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-14" />)}
        </div>
      )}

      {isError && (
        <div className="bg-error/8 border border-error/20 px-5 py-4">
          <p className="text-small font-semibold text-error">Failed to load users.</p>
        </div>
      )}

      {!isLoading && !isError && (
        <>
          <div className="border border-border bg-surface overflow-hidden">
            {/* Column headers */}
            <div className="hidden md:flex items-center px-5 py-2.5 border-b border-border bg-slate/40 gap-4">
              <p className="flex-1 text-caption text-muted uppercase tracking-[0.08em]">User</p>
              <p className="w-28 text-caption text-muted uppercase tracking-[0.08em]">Role</p>
              <p className="w-24 text-caption text-muted uppercase tracking-[0.08em]">Status</p>
              <p className="w-36 hidden lg:block text-caption text-muted uppercase tracking-[0.08em]">Verified</p>
              <p className="w-36 text-right text-caption text-muted uppercase tracking-[0.08em]">Joined</p>
            </div>

            {filtered.length === 0 && (
              <div className="px-5 py-10 text-center">
                <p className="text-small text-muted">
                  {search || roleFilter ? "No users match your filters." : "No users found."}
                </p>
              </div>
            )}

            {filtered.map(u => {
              const initials = `${u.firstName[0] ?? ""}${u.lastName[0] ?? ""}`.toUpperCase() || u.email[0].toUpperCase();
              return (
                <div key={u.id}
                  className="flex items-center gap-4 px-5 py-3.5 border-b border-border/60 last:border-b-0 hover:bg-slate/30 transition-colors">
                  {/* Avatar */}
                  <div className="w-8 h-8 bg-navy flex items-center justify-center shrink-0">
                    <span className="font-serif font-bold text-gold text-caption leading-none">{initials}</span>
                  </div>
                  {/* Name + email */}
                  <div className="flex-1 min-w-0">
                    <p className="text-small font-semibold text-charcoal truncate">
                      {u.firstName} {u.lastName}
                    </p>
                    <p className="text-caption text-muted truncate">{u.email}</p>
                  </div>
                  {/* Role */}
                  <div className="w-28 shrink-0">
                    <RoleBadge role={u.role} />
                  </div>
                  {/* Status */}
                  <div className="w-24 shrink-0">
                    <StatusBadge status={u.status} />
                  </div>
                  {/* Verified */}
                  <div className="w-36 hidden lg:block shrink-0">
                    <p className="text-caption text-muted">
                      {u.emailVerifiedAt
                        ? new Date(u.emailVerifiedAt).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })
                        : <span className="text-error/70">Not verified</span>}
                    </p>
                  </div>
                  {/* Joined */}
                  <div className="w-36 text-right shrink-0">
                    <p className="text-caption text-muted">
                      {new Date(u.createdAt).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-caption text-muted">
              {filtered.length} user{filtered.length !== 1 ? "s" : ""}
              {(search || roleFilter) ? " matched" : " loaded"}
            </p>
            {!search && !roleFilter && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                  disabled={offset === 0}
                  className="h-8 px-3 text-caption font-medium bg-surface border border-border text-charcoal hover:border-navy disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  ← Prev
                </button>
                <button
                  onClick={() => setOffset(offset + PAGE_SIZE)}
                  disabled={!hasMore}
                  className="h-8 px-3 text-caption font-medium bg-surface border border-border text-charcoal hover:border-navy disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </AdminPageShell>
  );
}
