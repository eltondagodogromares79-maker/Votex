"use client";

import LogoutButton from "@/src/features/auth/components/LogoutButton";

export default function CoordinatorLogoutButton({ compact = false, danger = false }: { compact?: boolean; danger?: boolean }) {
  return (
    <LogoutButton
      loginPath="/login"
      iconOnly={compact && !danger}
      className={`inline-flex h-9 items-center gap-2 px-3 text-xs font-semibold transition-colors disabled:cursor-wait disabled:opacity-50 ${danger ? "w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700" : compact ? "justify-center border border-border text-muted hover:border-navy/40 hover:bg-slate hover:text-navy" : "justify-center border border-white/20 text-white/75 hover:border-gold/60 hover:bg-white/5 hover:text-gold"}`}
    />
  );
}
