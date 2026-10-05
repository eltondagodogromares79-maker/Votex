import Link from "next/link";
import OrgHeader from "./OrgHeader";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface OrgPageShellProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  children: React.ReactNode;
}

export default function OrgPageShell({
  title,
  subtitle,
  action,
  breadcrumbs,
  children,
}: OrgPageShellProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <OrgHeader title={title} />

      <div className="flex-1 px-4 sm:px-6 py-4 sm:py-6 w-full">

        {/* ── Breadcrumb ─────────────────────────────────────────────────── */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-4">
            <ol className="flex flex-wrap items-center gap-0">
              {breadcrumbs.map((crumb, i) => {
                const isLast = i === breadcrumbs.length - 1;
                return (
                  <li key={i} className="flex items-center">
                    {/* Chevron separator */}
                    {i > 0 && (
                      <svg
                        className="w-3.5 h-3.5 text-border mx-1.5 shrink-0"
                        fill="none" stroke="currentColor" strokeWidth={2.5}
                        viewBox="0 0 24 24" aria-hidden="true"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    )}
                    {/* Crumb */}
                    {!isLast && crumb.href ? (
                      <Link
                        href={crumb.href}
                        className="text-caption text-muted hover:text-navy transition-colors truncate max-w-[140px] sm:max-w-xs"
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span
                        className={
                          isLast
                            ? "text-caption font-semibold text-navy truncate max-w-[140px] sm:max-w-xs"
                            : "text-caption text-muted truncate max-w-[140px] sm:max-w-xs"
                        }
                        aria-current={isLast ? "page" : undefined}
                      >
                        {crumb.label}
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
        )}

        {/* ── Page heading row ──────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-5 sm:mb-6">
          <div className="min-w-0">
            <h2 className="font-serif font-bold text-charcoal text-h1 leading-tight">
              {title}
            </h2>
            {subtitle && (
              <p className="text-small text-muted mt-1 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
          {action && (
            <div className="shrink-0 self-start sm:self-auto">
              {action}
            </div>
          )}
        </div>

        {children}
      </div>
    </div>
  );
}
