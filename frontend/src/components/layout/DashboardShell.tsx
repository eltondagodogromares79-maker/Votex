"use client";

import { useState } from "react";
import { Sidebar, MobileSidebar, MobileSidebarTrigger } from "./Sidebar";
import { SITE_CONFIG } from "@/src/config/site";
import Link from "next/link";
import type { NavItem } from "@/src/config/nav";

/**
 * DashboardShell — wraps every authenticated dashboard page.
 * Renders the desktop sidebar + mobile drawer alongside the page content.
 * Pass extraItems for pageant-scoped sub-navigation.
 */
export function DashboardShell({
  children,
  extraItems,
}: {
  children: React.ReactNode;
  extraItems?: NavItem[];
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate">
      {/* Desktop sidebar */}
      <Sidebar extraItems={extraItems} />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <div className="lg:hidden bg-navy h-14 px-4 flex items-center justify-between sticky top-0 z-[var(--z-header)]">
          <Link href="/" className="font-serif font-bold text-gold tracking-widest">
            {SITE_CONFIG.name.toUpperCase()}
          </Link>
          <MobileSidebarTrigger onClick={() => setMobileOpen(true)} />
        </div>

        {children}
      </div>

      {/* Mobile drawer */}
      <MobileSidebar
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        extraItems={extraItems}
      />
    </div>
  );
}
