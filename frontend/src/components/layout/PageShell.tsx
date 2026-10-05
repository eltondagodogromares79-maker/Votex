import { cn } from "@/src/lib/utils";
import Link from "next/link";

interface Breadcrumb {
  label: string;
  href?: string;
}

interface PageShellProps {
  /** Page title — rendered as an h1 */
  title: string;
  /** Optional breadcrumb trail */
  breadcrumbs?: Breadcrumb[];
  /** Slot for action buttons (top-right of header) */
  actions?: React.ReactNode;
  /** Main page content */
  children: React.ReactNode;
  className?: string;
}

/**
 * PageShell — used by every dashboard page.
 * Provides consistent title, breadcrumbs, actions slot, and content area.
 * Never copy-paste this structure into individual pages.
 */
export function PageShell({
  title,
  breadcrumbs,
  actions,
  children,
  className,
}: PageShellProps) {
  return (
    <main className={cn("flex-1 flex flex-col min-h-0", className)}>
      {/* Page header */}
      <div className="bg-surface border-b border-border py-4">
        <div className="container-page">
          {/* Breadcrumbs */}
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav aria-label="Breadcrumb" className="mb-1">
              <ol className="flex items-center gap-1 text-caption text-muted">
                {breadcrumbs.map((crumb, i) => (
                  <li key={i} className="flex items-center gap-1">
                    {i > 0 && <span aria-hidden="true">/</span>}
                    {crumb.href ? (
                      <Link
                        href={crumb.href}
                        className="hover:text-charcoal transition-colors"
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className="text-charcoal font-medium" aria-current="page">
                        {crumb.label}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          )}

          {/* Title + actions row */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h1 className="text-h2 font-serif text-charcoal">{title}</h1>
            {actions && (
              <div className="flex items-center gap-2 flex-wrap">{actions}</div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 py-6">
        <div className="container-page">{children}</div>
      </div>
    </main>
  );
}
