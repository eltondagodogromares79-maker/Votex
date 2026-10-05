/**
 * Navigation configuration — single source of truth for all nav items.
 * Keyed by FrontendRole so one Sidebar component can render any role's nav.
 */

import type { FrontendRole } from "@/src/lib/auth/roles";

export interface NavItem {
  label: string;
  href: string;
  icon?: string;
  exact?: boolean;
  badge?: string;
  children?: NavItem[];
}

/** Public site nav (Header / Footer) */
export const PUBLIC_NAV: NavItem[] = [
  { label: "Home",     href: "/",        exact: true },
  { label: "Pageants", href: "/pageants" },
  { label: "About",    href: "/about" },
  { label: "Pricing",  href: "/pricing" },
  { label: "FAQ",      href: "/faq" },
  { label: "Contact",  href: "/contact" },
];

/** Footer-only links */
export const FOOTER_LEGAL_NAV: NavItem[] = [
  { label: "Terms & Conditions", href: "/terms" },
  { label: "Privacy Policy",     href: "/privacy" },
  { label: "Refund Policy",      href: "/refund-policy" },
];

/** Role-specific sidebar / dashboard nav */
export const DASHBOARD_NAV: Record<FrontendRole, NavItem[]> = {

  admin: [
    { label: "Dashboard", href: "/admin",           icon: "home",        exact: true },
    { label: "Payments",  href: "/admin/payments",  icon: "credit-card" },
    { label: "Users",     href: "/admin/users",     icon: "users" },
  ],

  // org_owner: owns the organization; creates and manages pageants + staff
  org_owner: [
    { label: "Dashboard",    href: "/org_owner",              icon: "home",      exact: true },
    { label: "My Pageants",  href: "/org_owner/pageants",     icon: "crown" },
    { label: "Team",         href: "/org_owner/teams",        icon: "users" },
    { label: "Billing",      href: "/org_owner/billing",      icon: "credit-card" },
  ],

  coordinator: [
    { label: "Dashboard",   href: "/coordinator",              icon: "home",  exact: true },
    { label: "My Pageants", href: "/coordinator/pageants",     icon: "crown" },
    { label: "Billing",     href: "/coordinator/billing",      icon: "credit-card" },
  ],

  judge: [
    { label: "Dashboard",      href: "/judge",  icon: "home",           exact: true },
    { label: "My Assignments", href: "/judge",  icon: "clipboard-list" },
  ],

  tabulator: [
    { label: "Dashboard",      href: "/tabulator",  icon: "home",  exact: true },
    { label: "My Assignments", href: "/tabulator",  icon: "table" },
  ],

  // audience: general users; browse live pageants and vote
  audience: [
    { label: "Home",          href: "/audience",          icon: "home",   exact: true },
    { label: "Live Pageants", href: "/audience/pageants", icon: "crown" },
    { label: "My Votes",      href: "/audience/votes",    icon: "star" },
  ],
};

/**
 * Pageant-scoped sub-navigation for the coordinator / org-owner pageant detail view.
 */
export function getPageantSubNav(pageantId: string, base = "/coordinator"): NavItem[] {
  const root = `${base}/pageants/${pageantId}`;
  return [
    { label: "Overview",    href: root,                    icon: "chart-bar",  exact: true },
    { label: "Candidates",  href: `${root}/candidates`,    icon: "user-group" },
    { label: "Categories",  href: `${root}/categories`,    icon: "tag" },
    { label: "Rounds",      href: `${root}/rounds`,        icon: "calendar" },
    { label: "Judges",      href: `${root}/judges`,        icon: "star" },
    { label: "Tabulators",  href: `${root}/tabulators`,    icon: "calculator" },
  ];
}
