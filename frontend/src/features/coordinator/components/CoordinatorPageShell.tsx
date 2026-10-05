/**
 * OrgPageShell — standard page wrapper for every org-owner dashboard page.
 *
 * Renders:
 *   - Sticky OrgHeader (passes page title)
 *   - Page heading area (title, subtitle, optional action button)
 *   - Content area (children)
 */

import CoordinatorHeader from "./CoordinatorHeader";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface CoordinatorPageShellProps {
  /** Large heading shown under the header bar */
  title: string;
  /** Optional muted subtitle below the title */
  subtitle?: string;
  /** Optional element floated to the right of the title row (e.g. a Button) */
  action?: React.ReactNode;
  /** Optional breadcrumb items */
  breadcrumbs?: BreadcrumbItem[];
  children: React.ReactNode;
}

export default function CoordinatorPageShell({
  title,
  subtitle,
  action,
  breadcrumbs,
  children,
}: CoordinatorPageShellProps) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Sticky top bar */}
      <CoordinatorHeader title={title} />

      {/* Page body */}
      <div className="flex-1 px-6 py-6 max-w-full w-full mx-auto">

        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-4">
            <ol className="flex items-center gap-1.5 text-caption text-muted">
              {breadcrumbs.map((crumb, i) => (
                <li key={i} className="flex items-center gap-1.5">
                  {i > 0 && (
                    <svg className="w-3 h-3 text-border shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  )}
                  {crumb.href ? (
                    <a href={crumb.href} className="hover:text-navy transition-colors">{crumb.label}</a>
                  ) : (
                    <span className="text-charcoal font-medium">{crumb.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        {/* Page heading row */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="font-serif font-bold text-charcoal text-h1 leading-tight">
              {title}
            </h2>
            {subtitle && (
              <p className="text-small text-muted mt-1 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>

        {/* Content */}
        {children}
      </div>
    </div>
  );
}
