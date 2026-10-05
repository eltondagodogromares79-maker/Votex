"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/src/lib/utils";
import { SITE_CONFIG } from "@/src/config/site";
import type { NavItem } from "@/src/config/nav";

// ── Icon resolver ─────────────────────────────────────────────────────────────
function NavIcon({ name, className }: { name?: string; className?: string }) {
  const cls = cn("w-5 h-5", className);
  switch (name) {
    case "home":
      return <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>;
    case "star":
      return <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>;
    case "users":
      return <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>;
    default:
      return <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /></svg>;
  }
}

// ── Single nav item ────────────────────────────────────────────────────────────
function SidebarItem({ item, onClick }: { item: NavItem; onClick?: () => void }) {
  const pathname = usePathname();
  const active = item.exact
    ? pathname === item.href
    : pathname.startsWith(item.href) && item.href !== "/";

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md text-small font-medium transition-colors",
        active
          ? "bg-gold/10 text-gold"
          : "text-white/70 hover:text-white hover:bg-white/5",
      )}
      aria-current={active ? "page" : undefined}
    >
      <NavIcon name={item.icon} className={active ? "text-gold" : "text-white/50"} />
      <span>{item.label}</span>
      {item.badge && (
        <span className="ml-auto text-caption bg-gold text-navy px-1.5 py-0.5 rounded font-semibold">
          {item.badge}
        </span>
      )}
    </Link>
  );
}

// ── Desktop sidebar ────────────────────────────────────────────────────────────
export function Sidebar({ extraItems = [] }: { extraItems?: NavItem[] }) {
  return (
    <aside className="hidden lg:flex flex-col w-56 shrink-0 bg-navy h-full min-h-screen sticky top-0">
      <div className="px-4 h-16 flex items-center border-b border-white/10">
        <Link href="/" className="font-serif font-bold text-gold tracking-widest">
          {SITE_CONFIG.name.toUpperCase()}
        </Link>
      </div>

      <nav aria-label="Dashboard navigation" className="flex-1 px-2 py-4 flex flex-col gap-1">
        {extraItems.map((item) => (
          <SidebarItem key={item.href} item={item} />
        ))}
      </nav>
    </aside>
  );
}

// ── Mobile trigger ─────────────────────────────────────────────────────────────
export function MobileSidebarTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Open menu"
      className="lg:hidden p-2 text-white/70 hover:text-white"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
  );
}

// ── Mobile sidebar (drawer) ────────────────────────────────────────────────────
export function MobileSidebar({
  open,
  onClose,
  extraItems = [],
}: {
  open: boolean;
  onClose: () => void;
  extraItems?: NavItem[];
}) {
  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-navy/50 z-[var(--z-sidebar)]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="fixed inset-y-0 left-0 w-64 bg-navy z-[calc(var(--z-sidebar)+1)] flex flex-col">
        <div className="px-4 h-16 flex items-center justify-between border-b border-white/10">
          <span className="font-serif font-bold text-gold tracking-widest">
            {SITE_CONFIG.name.toUpperCase()}
          </span>
          <button onClick={onClose} aria-label="Close menu" className="text-white/50 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 px-2 py-4 flex flex-col gap-1 overflow-y-auto">
          {extraItems.map((item) => (
            <SidebarItem key={item.href} item={item} onClick={onClose} />
          ))}
        </nav>
      </div>
    </>
  );
}
