"use client";

import Image from "next/image";
import Link from "next/link";
import { MdNotifications } from "react-icons/md";
import { SITE_CONFIG } from "@/src/config/site";
import { useSession } from "@/src/features/auth/context/SessionContext";
import LogoutButton from "@/src/features/auth/components/LogoutButton";
import FirstLoginPasswordBanner from "@/src/features/auth/components/FirstLoginPasswordBanner";
import { useNotifications } from "@/src/features/notifications/hooks/useNotifications";

export default function CoordinatorHeader({ pageantTitle }: { pageantTitle?: string }) {
  const { currentUser } = useSession();
  const { data: notifications } = useNotifications(1, 0);
  const fullName = `${currentUser?.firstName ?? ""} ${currentUser?.lastName ?? ""}`.trim();
  const initials = `${currentUser?.firstName?.[0] ?? ""}${currentUser?.lastName?.[0] ?? ""}` || "C";

  if (pageantTitle) {
    return (
      <>
        <header className="sticky top-0 z-[var(--z-header)] border-b border-white/10 bg-navy text-white shadow-lg shadow-navy/10">
          <div className="container-page flex min-h-14 items-center justify-between gap-2 py-2 sm:min-h-[76px] sm:gap-4 sm:py-3">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold">Pageant workspace</p>
              <h1 className="truncate font-serif text-lg font-semibold sm:text-xl">{pageantTitle}</h1>
            </div>
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <Link href="/coordinator/pageants" className="inline-flex h-9 items-center border border-white/25 px-2 text-xs font-semibold text-white/80 transition-colors hover:border-gold/60 hover:bg-white/5 hover:text-gold sm:h-10 sm:px-4 sm:text-sm">
                <span className="sm:hidden">Back</span><span className="hidden sm:inline">Back to assigned pageants</span>
              </Link>
              <Link href="/coordinator/account/profile" aria-label="Open profile" className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gold/35 bg-white/5 text-xs font-bold text-gold transition-colors hover:border-gold">
                {currentUser?.profileImageUrl ? <Image src={currentUser.profileImageUrl} alt="" width={36} height={36} className="h-full w-full object-cover" /> : initials}
              </Link>
              <LogoutButton loginPath="/login" iconOnly className="inline-flex h-10 w-10 items-center justify-center border border-error/30 text-red-200 transition-colors hover:border-error/60 hover:bg-error/10 disabled:cursor-wait disabled:opacity-50" />
            </div>
          </div>
        </header>
        <FirstLoginPasswordBanner />
      </>
    );
  }

  return (
    <>
      <header className="sticky top-0 z-[var(--z-header)] border-b border-white/10 bg-navy text-white shadow-lg shadow-navy/10">
        <div className="container-page flex min-h-14 items-center justify-between gap-2 py-2 sm:min-h-[76px] sm:gap-4 sm:py-3">
          <Link href="/coordinator/pageants" aria-label={`${SITE_CONFIG.name} assigned pageants`} className="flex min-w-0 items-center gap-3">
            <Image src="/votex-logo.png" alt={SITE_CONFIG.name} width={100} height={100} priority className="h-9 w-9 shrink-0 object-contain sm:h-12 sm:w-12" />
            <span className="hidden border-l border-white/15 pl-3 sm:block">
              <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-gold">Coordinator portal</span>
              <span className="mt-0.5 block text-xs text-white/50">Pageant management</span>
            </span>
          </Link>

          <div className="flex min-w-0 shrink-0 items-center gap-1 sm:gap-4">
            <Link href="/coordinator/pageants" className="hidden px-2 py-2 text-xs font-semibold text-white/65 transition-colors hover:text-gold sm:block">Assigned pageants</Link>
            <Link href="/coordinator/account/profile" className="hidden px-2 py-2 text-xs font-semibold text-white/65 transition-colors hover:text-gold sm:block">Profile</Link>
            <Link href="/coordinator/account/security" className="hidden px-2 py-2 text-xs font-semibold text-white/65 transition-colors hover:text-gold sm:block">Security</Link>
            <Link href="/coordinator/notifications" aria-label="Notifications" className="relative flex h-10 w-10 items-center justify-center border border-white/10 text-white/70 transition-colors hover:border-gold/40 hover:text-gold">
              <MdNotifications className="text-xl" />
              {!!notifications?.unreadCount && <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-error px-1 text-center text-[9px] font-bold leading-4 text-white">{notifications.unreadCount > 99 ? "99+" : notifications.unreadCount}</span>}
            </Link>
            <span className="hidden h-8 w-px bg-white/15 sm:block" />
            <div className="hidden min-w-0 text-right sm:block">
              <p className="max-w-40 truncate text-xs font-semibold text-white">{fullName || "Coordinator"}</p>
              <p className="mt-0.5 text-[10px] uppercase tracking-[0.12em] text-white/40">Coordinator account</p>
            </div>
            <Link href="/coordinator/account/profile" aria-label="Open profile" className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gold/35 bg-white/5 text-xs font-bold text-gold transition-colors hover:border-gold">
              {currentUser?.profileImageUrl ? <Image src={currentUser.profileImageUrl} alt="" width={36} height={36} className="h-full w-full object-cover" /> : initials}
            </Link>
            <LogoutButton loginPath="/login" className="inline-flex h-9 items-center gap-0 border border-error/30 px-2 text-[0px] font-semibold text-red-200 transition-colors hover:border-error/60 hover:bg-error/10 disabled:cursor-wait disabled:opacity-50 sm:h-10 sm:gap-2 sm:px-3 sm:text-xs" />
          </div>
        </div>
      </header>
      <FirstLoginPasswordBanner />
    </>
  );
}
