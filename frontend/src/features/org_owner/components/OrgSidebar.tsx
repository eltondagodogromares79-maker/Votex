"use client";

import { SITE_CONFIG } from "@/src/config/site";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useSession } from "@/src/features/auth/context/SessionContext";
import { ROLE_HOME } from "@/src/config/permissions";
import LogoutButton from "@/src/features/auth/components/LogoutButton";
import {
  MdDashboard,
  MdChevronLeft,
  MdChevronRight,
  MdExpandMore,
  MdExpandLess,
  MdSupervisorAccount,
  MdGavel,
  MdPeople,
  MdCardMembership,
  MdAttachMoney,
  MdHistory,
  MdAccountCircle,
  MdSecurity,
  MdSupportAgent,
  MdEmojiEvents,
  MdMarkEmailUnread,
} from "react-icons/md";

interface SidebarProps {
  className?: string;
}

const navSections = [
  {
    title: "Overview",
    items: [
      {
        name: "Dashboard",
        href: "/org_owner/dashboard",
        icon: MdDashboard,
      },
    ],
  },
  {
    title: "Events",
    items: [
      {
        name: "Pageants",
        href: "/org_owner/pageants",
        icon: MdEmojiEvents,
      },
    ],
  },
  {
    title: "Teams",
    items: [
      {
        name: "Coordinator",
        href: "/org_owner/teams/coordinator",
        icon: MdSupervisorAccount,
      },
      {
        name: "Judges",
        href: "/org_owner/teams/judges",
        icon: MdGavel,
      },
      {
        name: "Tabulator",
        href: "/org_owner/teams/tabulator",
        icon: MdPeople,
      },
    ],
  },
  {
    title: "Billing",
    items: [
      {
        name: "My Subscription",
        href: "/org_owner/billing/subscription",
        icon: MdCardMembership,
      },
      {
        name: "Plans and Pricing",
        href: "/org_owner/billing/plans",
        icon: MdAttachMoney,
      },
      {
        name: "Transaction History",
        href: "/org_owner/billing/transactions",
        icon: MdHistory,
      },
    ],
  },
  {
    title: "Activity",
    items: [
      {
        name: "Activity Logs",
        href: "/org_owner/activity-logs",
        icon: MdHistory,
      },
      {
        name: "Notifications",
        href: "/notifications",
        icon: MdMarkEmailUnread,
      },
    ],
  },
  {
    title: "Settings",
    items: [
      {
        name: "Accounts",
        href: "/org_owner/settings/accounts",
        icon: MdAccountCircle,
      },
      {
        name: "Security",
        href: "/org_owner/settings/security",
        icon: MdSecurity,
      },
      {
        name: "Contact & Support",
        href: "/org_owner/settings/support",
        icon: MdSupportAgent,
      },
    ],
  },
];

export default function Sidebar({ className = "" }: SidebarProps) {
  const pathname = usePathname();
  const { currentUser } = useSession();
  const notificationHref = currentUser ? `${ROLE_HOME[currentUser.role]}/notifications` : "/org_owner/notifications";
  const [collapsed, setCollapsed] = useState(false);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    Overview: true,
    Events:   true,
    Teams:    true,
    Billing:  true,
    Activity: true,
    Settings: true,
  });

  const toggleSection = (title: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  return (
    <aside
      className={`
        sticky top-0 z-sidebar
        hidden h-screen shrink-0 flex-col lg:flex
        bg-navy text-white
        border-r border-white/10
        transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
        ${collapsed ? "w-[72px]" : "w-64"}
        ${className}
      `}
    >
      {/* ── Logo + Toggle ─────────────────────────────────────────── */}
      <div
        className={`
          relative shrink-0
          flex flex-col items-center justify-center
          border-b border-white/10
          transition-all duration-300
          ${collapsed ? "h-[112px] gap-2 py-3" : "h-[112px]"}
        `}
      >
        <Link
          href="/org_owner"
          aria-label={`${SITE_CONFIG.name} – home`}
          className="group relative flex flex-col items-center justify-center"
        >
          <Image
            src="/votex-logo.png"
            alt={`${SITE_CONFIG.name} logo`}
            width={100}
            height={100}
            priority
            className={`h-auto w-auto transition-all duration-300 ${collapsed ? "max-w-14" : ""}`}
          />

          {collapsed && (
            <span
              className="
                pointer-events-none absolute left-full top-1/2 z-[60]
                ml-3 -translate-y-1/2 whitespace-nowrap
                rounded-md border border-white/10 bg-navy
                px-3 py-1.5 text-[13px] font-medium text-white
                opacity-0 shadow-xl transition-opacity duration-150
                group-hover:opacity-100
                before:absolute before:right-full before:top-1/2
                before:-translate-y-1/2 before:border-[5px] before:border-transparent
                before:border-r-navy
              "
            >
              {SITE_CONFIG.name}
            </span>
          )}
        </Link>

        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className={`
            flex h-7 w-7 items-center justify-center
            rounded-md border border-white/10 text-white/45
            transition-all duration-200
            hover:border-gold/50 hover:bg-white/5 hover:text-gold
            focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold/40
            ${collapsed ? "relative" : "absolute right-4 top-1/2 -translate-y-1/2"}
          `}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <MdChevronRight className="h-4.5 w-4.5" />
          ) : (
            <MdChevronLeft className="h-4.5 w-4.5" />
          )}
        </button>
      </div>

      {currentUser && !currentUser.emailVerifiedAt && (
        <div className={`shrink-0 px-2.5 pt-3 ${collapsed ? "flex justify-center" : "px-3"}`}>
          <Link
            href="/org_owner/settings/accounts#email-verification"
            title={collapsed ? "Verify your email" : undefined}
            className={`flex items-center gap-2 border border-gold/30 bg-gold/10 text-gold hover:bg-gold/15 transition-colors ${
              collapsed ? "h-10 w-10 justify-center" : "px-3 py-2.5"
            }`}
          >
            <MdMarkEmailUnread className="h-4 w-4 shrink-0" />
            {!collapsed && (
              <span className="text-caption font-semibold leading-snug">
                Verify your email
              </span>
            )}
          </Link>
        </div>
      )}

      {/* ── Navigation ────────────────────────────────────────────── */}
      <nav
        className={`
          flex-1 px-2.5 py-5
          ${collapsed ? "overflow-visible" : "overflow-y-auto"}
        `}
        aria-label="Main navigation"
      >
        <div className="space-y-5">
          {navSections.map((section, sectionIndex) => {
            const isSectionOpen = openSections[section.title] ?? true;
            const showItems = collapsed || isSectionOpen;

            return (
              <div key={section.title}>
                {/* Section Header (only when expanded) */}
                {!collapsed && (
                  <button
                    type="button"
                    onClick={() => toggleSection(section.title)}
                    className="
                      group mb-1 flex w-full items-center justify-between
                      rounded-md px-3 py-1.5
                      text-[11px] font-semibold uppercase tracking-[0.14em]
                      text-white/30
                      transition-colors duration-150
                      hover:bg-white/5 hover:text-white/50
                    "
                  >
                    <span>{section.title}</span>
                    <span className="text-white/25 group-hover:text-white/40">
                      {isSectionOpen ? (
                        <MdExpandLess className="h-4 w-4" />
                      ) : (
                        <MdExpandMore className="h-4 w-4" />
                      )}
                    </span>
                  </button>
                )}

                {/* Subtle separator when collapsed */}
                {collapsed && sectionIndex > 0 && (
                  <div className="my-2 flex justify-center">
                    <div className="h-px w-8 bg-white/10" />
                  </div>
                )}

                {/* Items */}
                {showItems && (
                  <ul className="space-y-0.5">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const href = item.href === "/notifications"
                        ? notificationHref
                        : item.href === "/org_owner/settings/security" && currentUser?.role === "tabulator"
                          ? "/tabulator/account/security"
                          : item.href;
                      const isActive =
                        pathname === href ||
                        pathname.startsWith(`${href}/`);

                      return (
                        <li key={item.name}>
                          <Link
                            href={href}
                            className={`
                              group relative
                              flex h-10.5 items-center
                              rounded-md
                              transition-all duration-150
                              ${collapsed ? "justify-center" : "gap-3 px-3"}
                              ${
                                isActive
                                  ? "bg-white/10 text-gold"
                                  : "text-white/55 hover:bg-white/5 hover:text-white"
                              }
                            `}
                          >
                            {isActive && (
                              <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-gold" />
                            )}

                            <Icon
                              className={`
                                h-[18px] w-[18px] shrink-0
                                transition-colors duration-150
                                ${
                                  isActive
                                    ? "text-gold"
                                    : "text-white/40 group-hover:text-gold/80"
                                }
                              `}
                            />

                            {!collapsed && (
                              <span className="text-[13.5px] font-medium tracking-wide truncate">
                                {item.name}
                              </span>
                            )}

                            {/* Tooltip only on nav items */}
                            {collapsed && (
                              <span
                                className="
                                  pointer-events-none absolute left-full top-1/2 z-[60]
                                  ml-3 -translate-y-1/2 whitespace-nowrap
                                  rounded-md border border-white/10 bg-navy
                                  px-3 py-1.5 text-[13px] font-medium text-white
                                  opacity-0 shadow-xl transition-opacity duration-150
                                  group-hover:opacity-100
                                  before:absolute before:right-full before:top-1/2
                                  before:-translate-y-1/2 before:border-[5px] before:border-transparent
                                  before:border-r-navy
                                "
                              >
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

      <div className={`shrink-0 border-t border-white/10 px-2.5 py-3 ${collapsed ? "flex justify-center" : ""}`}>
        {currentUser?.role === "tabulator" ? <Link href="/account/delete" className={`mb-2 inline-flex h-9 items-center text-white/55 transition-colors hover:bg-white/5 hover:text-gold ${collapsed ? "w-10 justify-center" : "w-full gap-3 px-3 text-[13px] font-medium"}`} title={collapsed ? "Account" : undefined}>
          <MdAccountCircle className="h-[18px] w-[18px] shrink-0" />{!collapsed ? "Account" : null}
        </Link> : null}
        <LogoutButton
          loginPath="/login"
          iconOnly={collapsed}
          className={`group inline-flex h-10 items-center rounded-md text-red-400/80 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:cursor-wait disabled:opacity-50 ${collapsed ? "w-10 justify-center" : "w-full gap-3 px-3 text-[13.5px] font-medium"}`}
        />
      </div>

      {/* ── Footer ────────────────────────────────────────────────── */}
      {!collapsed && (
        <div className="shrink-0 border-t border-white/10 px-5 py-4 ">
          <p className="text-[11px] font-medium tracking-wide text-white/35">
            © 2026 {SITE_CONFIG.name}
          </p>
          <p className="mt-0.5 text-[11px] text-gold">
            Pageant Management Platform
          </p>
        </div>
      )}
    </aside>
  );
}
