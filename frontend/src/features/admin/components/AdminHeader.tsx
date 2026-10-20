"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession } from "@/src/features/auth/context/SessionContext";
import { useNotifications } from "@/src/features/notifications/hooks/useNotifications";

interface AdminHeaderProps {
  title?: string;
}

export default function AdminHeader({ title }: AdminHeaderProps) {
  const { currentUser, isReady } = useSession();
  const { data: notifications } = useNotifications(1, 0);
  const name = currentUser ? `${currentUser.firstName} ${currentUser.lastName}`.trim() : "";
  const initials = `${currentUser?.firstName?.[0] ?? ""}${currentUser?.lastName?.[0] ?? ""}` || "?";
  return (
    <header className="sticky top-0 z-[var(--z-header)] bg-surface border-b border-border h-16 flex items-center px-6 gap-4">
      <div className="flex-1 min-w-0">
        {title && (
          <h1 className="font-serif font-bold text-charcoal text-h3 truncate">{title}</h1>
        )}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <Link href="/admin/notifications" aria-label="Notifications"
          className="relative w-9 h-9 flex items-center justify-center text-muted hover:text-navy hover:bg-slate transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
          {!!notifications?.unreadCount && <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-error px-1 text-center text-[0.6rem] font-bold leading-4 text-white">{notifications.unreadCount > 99 ? "99+" : notifications.unreadCount}</span>}
        </Link>
        {/* <Link href="/contact" aria-label="Help"
          className="w-9 h-9 flex items-center justify-center text-muted hover:text-navy hover:bg-slate transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
          </svg>
        </Link> */}
        <div className="w-px h-6 bg-border" aria-hidden="true" />
        <div className="flex items-center gap-2.5">
          {currentUser?.profileImageUrl ? <Image src={currentUser.profileImageUrl} alt={name} width={32} height={32} className="h-8 w-8 shrink-0 object-cover" /> : <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-error"><span className="font-serif text-caption font-bold leading-none text-white">{initials}</span></div>}
          <div className="hidden sm:block">
            <p className="text-caption font-semibold text-charcoal leading-none mb-0.5">{name || (isReady ? "Account" : "Loading profile…")}</p>
            <p className="text-[0.65rem] text-error/80 font-semibold uppercase tracking-wide leading-none">Admin</p>
          </div>
        </div>
      </div>
    </header>
  );
}
