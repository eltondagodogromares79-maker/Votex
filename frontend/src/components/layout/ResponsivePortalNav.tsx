"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export interface PortalNavLink {
  label: string;
  href: string;
}

export function ResponsivePortalNav({ title, items, footer }: { title: string; items: PortalNavLink[]; footer?: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative z-[var(--z-header)] bg-navy text-white lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-portal-navigation"
        onClick={() => setOpen((value) => !value)}
        className="flex min-h-12 w-full items-center justify-between border-b border-white/10 px-4 py-2 text-left text-sm font-semibold"
      >
        <span className="truncate">{title} · Menu</span>
        <span aria-hidden="true" className="ml-3 shrink-0 text-gold">{open ? "Close" : "Open"}</span>
      </button>
      {open ? (
        <>
          <button type="button" aria-label="Close navigation" onClick={() => setOpen(false)} className="fixed inset-0 z-40 cursor-default bg-navy/45" />
          <nav id="mobile-portal-navigation" aria-label={`${title} navigation`} className="absolute inset-x-0 top-full z-50 max-h-[min(70dvh,32rem)] overflow-y-auto border-b border-white/10 bg-navy p-3 shadow-xl">
            <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
              {items.map((item) => {
                const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`));
                return (
                  <li key={`${item.label}-${item.href}`}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={`block min-h-11 break-words px-3 py-3 text-sm ${active ? "bg-white/10 text-gold" : "text-white/75 hover:bg-white/5 hover:text-white"}`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
            {footer ? <div className="mt-2 border-t border-white/10 pt-2">{footer}</div> : null}
          </nav>
        </>
      ) : null}
    </div>
  );
}
