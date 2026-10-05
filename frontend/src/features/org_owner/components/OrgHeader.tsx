"use client";

import Image from "next/image";
import Link from "next/link";
import { useSession } from "@/src/features/auth/context/SessionContext";

interface OrgHeaderProps {
  title?: string;
}

// ─── Avatar — real image or fallback initials ─────────────────────────────────

function Avatar({ firstName, lastName, profileImageUrl }: {
  firstName: string;
  lastName: string;
  profileImageUrl?: string | null;
}) {
  if (profileImageUrl) {
    return (
      <div className="w-8 h-8 shrink-0 overflow-hidden bg-navy">
        <Image
          src={profileImageUrl}
          alt={`${firstName} ${lastName}`}
          width={32}
          height={32}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  // No image — show a person icon on navy background
  return (
    <div className="w-8 h-8 bg-navy flex items-center justify-center shrink-0">
      <svg
        className="w-4.5 h-4.5 text-gold"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
        />
      </svg>
    </div>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────

export default function OrgHeader({ title }: OrgHeaderProps) {
  const { currentUser } = useSession();

  const firstName      = currentUser?.firstName      ?? "";
  const lastName       = currentUser?.lastName       ?? "";
  const profileImageUrl = currentUser?.profileImageUrl ?? null;
  const displayName    = firstName && lastName
    ? `${firstName} ${lastName}`
    : currentUser?.email ?? "Org Owner";

  return (
    <header className="sticky top-0 z-[var(--z-header)] bg-surface border-b border-border h-16 flex items-center px-6 gap-4">

      {/* Page title */}
      <div className="flex-1 min-w-0">
        {title && (
          <h1 className="font-serif font-bold text-charcoal text-h3 truncate">
            {title}
          </h1>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3 shrink-0">

        {/* Notification bell */}
        <button
          type="button"
          aria-label="Notifications"
          className="relative w-9 h-9 flex items-center justify-center text-muted
                     hover:text-navy hover:bg-slate transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-gold rounded-full" aria-hidden="true" />
        </button>

        {/* Help */}
        <Link
          href="/contact"
          aria-label="Help"
          className="w-9 h-9 flex items-center justify-center text-muted
                     hover:text-navy hover:bg-slate transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
          </svg>
        </Link>

        <div className="w-px h-6 bg-border" aria-hidden="true" />

        {/* User identity */}
        <div className="flex items-center gap-2.5">
          <Avatar
            firstName={firstName}
            lastName={lastName}
            profileImageUrl={profileImageUrl}
          />
          <div className="hidden sm:block">
            <p className="text-caption font-semibold text-charcoal leading-none mb-0.5 max-w-[140px] truncate">
              {displayName}
            </p>
            <p className="text-[0.65rem] text-muted leading-none">Organization Owner</p>
          </div>
        </div>

      </div>
    </header>
  );
}
