"use client";

import { SITE_CONFIG } from "@/src/config/site";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  MdDashboard,
  MdChevronLeft,
  MdChevronRight,
  MdExpandMore,
  MdExpandLess,
  MdBusiness,
  MdPeople,
  MdEmojiEvents,
  MdPayments,
  MdCardMembership,
  MdPriceCheck,
  MdFlag,
  MdManageSearch,
  MdTune,
  MdCampaign,
  MdPerson,
  MdSecurity,
  MdLogout,
} from "react-icons/md";

interface SidebarProps {
  className?: string;
}

const navSections = [
  {
    title: null as string | null,
    items: [
      { name: "Dashboard", href: "/admin/dashboard", icon: MdDashboard },
    ],
  },
  {
    title: "Platform",
    items: [
      { name: "Organizations", href: "/admin/organizations", icon: MdBusiness      },
      { name: "Users",         href: "/admin/users",         icon: MdPeople        },
      { name: "Pageants",      href: "/admin/pageants",      icon: MdEmojiEvents   },
    ],
  },
  {
    title: "Finance",
    items: [
      { name: "Payments",      href: "/admin/finance/payments",      icon: MdPayments       },
      { name: "Subscriptions", href: "/admin/finance/subscriptions", icon: MdCardMembership },
      { name: "Plans",         href: "/admin/finance/plans",         icon: MdPriceCheck     },
    ],
  },
  {
    title: "Moderation",
    items: [
      { name: "Reports",    href: "/admin/moderation/reports",    icon: MdFlag         },
      { name: "Audit Logs", href: "/admin/moderation/audit-logs", icon: MdManageSearch },
    ],
  },
  {
    title: "System",
    items: [
      { name: "Settings",      href: "/admin/system/settings",      icon: MdTune     },
      { name: "Announcements", href: "/admin/system/announcements", icon: MdCampaign },
    ],
  },
  {
    title: "Account",
    items: [
      { name: "Profile",  href: "/admin/account/profile",  icon: MdPerson   },
      { name: "Security", href: "/admin/account/security", icon: MdSecurity },
      { name: "Logout",   href: "/logout",                 icon: MdLogout   },
    ],
  },
];

export default function AdminSidebar({ className = "" }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    Platform: true, Finance: true, Moderation: true, System: true, Account: true,
  });

  const toggleSection = (title: string) =>
    setOpenSections((prev) => ({ ...prev, [title]: !prev[title] }));

  return (
    <aside
      className={`
        sticky top-0 z-sidebar
        flex h-screen flex-col
        bg-navy text-white
        border-r border-white/10
        transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
        ${collapsed ? "w-[72px]" : "w-64"}
        ${className}
      `}
    >
      {/* Logo + Toggle */}
      <div
        className={`
          relative shrink-0 flex flex-col items-center justify-center
          border-b border-white/10 transition-all duration-300
          ${collapsed ? "h-[96px] gap-2 py-3" : "h-20"}
        `}
      >
        <Link
          href="/admin/dashboard"
          aria-label={`${SITE_CONFIG.name} admin home`}
          className="group relative flex flex-col items-center justify-center"
        >
          <Image
            src="/votex-logo.png"
            alt={`${SITE_CONFIG.name} logo`}
            width={100} height={100} priority
            className={`object-contain transition-all duration-300 ${collapsed ? "h-8 w-8" : "h-9 w-9"}`}
          />
          {!collapsed && (
            <span className="mt-1.5 font-serif font-bold tracking-[0.18em] text-gold text-[12.5px] leading-none">
              {SITE_CONFIG.name.toUpperCase()}
            </span>
          )}
          {collapsed && (
            <span className="
              pointer-events-none absolute left-full top-1/2 z-[60]
              ml-3 -translate-y-1/2 whitespace-nowrap rounded-md
              border border-white/10 bg-navy px-3 py-1.5
              text-[13px] font-medium text-white opacity-0 shadow-xl
              transition-opacity duration-150 group-hover:opacity-100
              before:absolute before:right-full before:top-1/2
              before:-translate-y-1/2 before:border-[5px] before:border-transparent
              before:border-r-navy
            ">
              {SITE_CONFIG.name}
            </span>
          )}
        </Link>

        {!collapsed && (
          <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-error/80 px-2 py-0.5 bg-error/10 rounded-sm">
            Admin
          </span>
        )}

        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className={`
            flex h-7 w-7 items-center justify-center rounded-md
            border border-white/10 text-white/45
            transition-all duration-200
            hover:border-gold/50 hover:bg-white/5 hover:text-gold
            focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold/40
            ${collapsed ? "relative" : "absolute right-4 top-1/2 -translate-y-1/2"}
          `}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <MdChevronRight className="h-4 w-4" /> : <MdChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav
        className={`flex-1 px-2.5 py-5 ${collapsed ? "overflow-visible" : "overflow-y-auto"}`}
        aria-label="Admin navigation"
      >
        <div className="space-y-5">
          {navSections.map((section, sectionIndex) => {
            const isSectionOpen = section.title
              ? (openSections[section.title] ?? true)
              : true;
            const showItems = collapsed || isSectionOpen;

            return (
              <div key={sectionIndex}>
                {section.title && !collapsed && (
                  <button
                    type="button"
                    onClick={() => toggleSection(section.title as string)}
                    className="
                      group mb-1 flex w-full items-center justify-between
                      rounded-md px-3 py-1.5
                      text-[11px] font-semibold uppercase tracking-[0.14em] text-white/30
                      transition-colors duration-150 hover:bg-white/5 hover:text-white/50
                    "
                  >
                    <span>{section.title}</span>
                    <span className="text-white/25 group-hover:text-white/40">
                      {isSectionOpen ? <MdExpandLess className="h-4 w-4" /> : <MdExpandMore className="h-4 w-4" />}
                    </span>
                  </button>
                )}

                {section.title && collapsed && sectionIndex > 0 && (
                  <div className="my-2 flex justify-center">
                    <div className="h-px w-8 bg-white/10" />
                  </div>
                )}

                {showItems && (
                  <ul className="space-y-0.5">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const isActive =
                        pathname === item.href ||
                        pathname.startsWith(`${item.href}/`);
                      const isLogout = item.name === "Logout";

                      return (
                        <li key={item.name}>
                          <Link
                            href={item.href}
                            className={`
                              group relative flex h-11 items-center rounded-md
                              transition-all duration-150
                              ${collapsed ? "justify-center" : "gap-3 px-3"}
                              ${
                                isLogout
                                  ? "text-red-400/80 hover:bg-red-500/10 hover:text-red-400"
                                  : isActive
                                  ? "bg-white/10 text-gold"
                                  : "text-white/55 hover:bg-white/5 hover:text-white"
                              }
                            `}
                          >
                            {isActive && !isLogout && (
                              <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-gold" />
                            )}
                            <Icon
                              className={`
                                h-[18px] w-[18px] shrink-0 transition-colors duration-150
                                ${isLogout ? "text-red-400/70 group-hover:text-red-400" : isActive ? "text-gold" : "text-white/40 group-hover:text-gold/80"}
                              `}
                            />
                            {!collapsed && (
                              <span className="text-[13.5px] font-medium tracking-wide truncate">
                                {item.name}
                              </span>
                            )}
                            {collapsed && (
                              <span className="
                                pointer-events-none absolute left-full top-1/2 z-[100]
                                ml-3 -translate-y-1/2 whitespace-nowrap rounded-md
                                border border-white/10 bg-navy px-3 py-1.5
                                text-[13px] font-medium text-white opacity-0 shadow-xl
                                transition-opacity duration-150 group-hover:opacity-100
                                before:absolute before:right-full before:top-1/2
                                before:-translate-y-1/2 before:border-[5px] before:border-transparent
                                before:border-r-navy
                              ">
                                {item.name}
                              </span>
                            )}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="shrink-0 border-t border-white/10 px-5 py-4">
          <p className="text-[11px] font-medium tracking-wide text-white/35">
            © 2026 {SITE_CONFIG.name}
          </p>
          <p className="mt-0.5 text-[11px] text-error/60">
            Platform Administration
          </p>
        </div>
      )}
    </aside>
  );
}
