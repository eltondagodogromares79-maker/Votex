import AdminHeader from "./AdminHeader";

interface BreadcrumbItem { label: string; href?: string; }

interface AdminPageShellProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  children: React.ReactNode;
}

export default function AdminPageShell({
  title, subtitle, action, breadcrumbs, children,
}: AdminPageShellProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <AdminHeader title={title} />
      <div className="flex-1 px-6 py-6 max-w-full w-full mx-auto">

        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-4">
            <ol className="flex items-center gap-1.5 text-caption text-muted">
              {breadcrumbs.map((crumb, i) => (
                <li key={i} className="flex items-center gap-1.5">
                  {i > 0 && (
                    <svg className="w-3 h-3 text-border shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  )}
                  {crumb.href
                    ? <a href={crumb.href} className="hover:text-navy transition-colors">{crumb.label}</a>
                    : <span className="text-charcoal font-medium">{crumb.label}</span>}
                </li>
              ))}
            </ol>
          </nav>
        )}

        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="font-serif font-bold text-charcoal text-h1 leading-tight">{title}</h2>
            {subtitle && <p className="text-small text-muted mt-1 leading-relaxed">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>

        {children}
      </div>
    </div>
  );
}
