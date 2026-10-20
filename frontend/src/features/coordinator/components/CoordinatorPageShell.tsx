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
  /** Render the heading as a navy feature hero. */
  hero?: boolean;
  /** Show the pageant workspace header instead of the account header. */
  pageantTitle?: string;
  children: React.ReactNode;
}

export default function CoordinatorPageShell({
  title,
  subtitle,
  action,
  breadcrumbs,
  hero = false,
  pageantTitle,
  children,
}: CoordinatorPageShellProps) {
  return (
    <div className="flex min-h-screen min-w-0 flex-col">
      {/* Sticky top bar */}
      <CoordinatorHeader pageantTitle={pageantTitle} />

      {hero ? <section className="relative isolate overflow-hidden border-b border-gold/25 bg-navy py-12 text-white sm:py-14">
        <div className="container-page relative">
          <div className="pointer-events-none absolute -right-10 -top-36 -z-10 h-[360px] w-[360px] rounded-full border border-gold/10" />
          <p className="mb-3 text-caption font-semibold uppercase tracking-[0.18em] text-gold">Coordinator workspace</p>
          <h1 className="break-words font-serif text-[1.625rem] font-bold leading-tight sm:text-[1.875rem] lg:text-[2.25rem]">{title}</h1>
          {subtitle ? <p className="mt-3 max-w-2xl text-small leading-relaxed text-white/60">{subtitle}</p> : null}
          {breadcrumbs && breadcrumbs.length > 0 ? <nav aria-label="Breadcrumb" className="mt-5"><ol className="flex flex-wrap items-center gap-2 text-caption text-white/45">{breadcrumbs.map((crumb, index) => <li key={`${crumb.label}-${index}`} className="flex items-center gap-2">{index > 0 ? <span aria-hidden="true">/</span> : null}{crumb.href ? <a href={crumb.href} className="transition-colors hover:text-gold">{crumb.label}</a> : <span className="text-white/75">{crumb.label}</span>}</li>)}</ol></nav> : null}
        </div>
      </section> : null}

      {/* Page body */}
      <div className={hero ? "container-page min-w-0 flex-1 py-5 sm:py-6" : "min-w-0 w-full flex-1 px-4 py-5 sm:px-6 sm:py-6"}>

        {/* Breadcrumbs */}
        {!hero && breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-4">
            <ol className="flex flex-wrap items-center gap-1.5 text-caption text-muted">
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
        {!hero && <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <h2 className="break-words font-serif font-bold text-charcoal text-h1 leading-tight">
              {title}
            </h2>
            {subtitle && (
              <p className="text-small text-muted mt-1 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="w-full shrink-0 sm:w-auto">{action}</div>}
        </div>}

        {/* Content */}
        {children}
      </div>
    </div>
  );
}
