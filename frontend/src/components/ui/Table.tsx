import { cn } from "@/src/lib/utils";

// ── Responsive table wrapper ──────────────────────────────────────────────────
// On small screens (< md), collapses to a stacked card layout via CSS.
// Each row becomes a "card" and cells are labelled with data-label.

interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
  /** Whether this column is displayed as the primary "title" in card view */
  primary?: boolean;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  className?: string;
  /** Rendered when data is empty — use EmptyState component */
  emptyContent?: React.ReactNode;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  className,
  emptyContent,
}: TableProps<T>) {
  if (data.length === 0 && emptyContent) {
    return <>{emptyContent}</>;
  }

  return (
    <>
      {/* Desktop: standard table */}
      <div className={cn("hidden md:block overflow-x-auto", className)}>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border">
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  scope="col"
                  className={cn(
                    "pb-3 pr-4 text-caption font-semibold uppercase tracking-wide text-muted",
                    col.className,
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr
                key={keyExtractor(row)}
                className="border-b border-border/50 hover:bg-slate/50 transition-colors"
              >
                {columns.map((col) => (
                  <td
                    key={String(col.key)}
                    className={cn(
                      "py-3 pr-4 text-body text-charcoal",
                      col.className,
                    )}
                  >
                    {col.render
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[String(col.key)] ?? "—")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: card list */}
      <div className="md:hidden space-y-3">
        {data.map((row) => (
          <div
            key={keyExtractor(row)}
            className="bg-surface rounded-md p-4 space-y-2"
          >
            {columns.map((col) => {
              const value = col.render
                ? col.render(row)
                : String((row as Record<string, unknown>)[String(col.key)] ?? "—");

              if (col.primary) {
                return (
                  <div key={String(col.key)} className="text-body font-medium text-charcoal">
                    {value}
                  </div>
                );
              }

              return (
                <div key={String(col.key)} className="flex justify-between items-start gap-2">
                  <span className="text-caption text-muted shrink-0">{col.header}</span>
                  <span className="text-small text-charcoal text-right">{value}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </>
  );
}

// ── Pagination ────────────────────────────────────────────────────────────────
interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-between mt-4"
    >
      <p className="text-small text-muted">
        Page {page} of {totalPages}
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
          className="h-8 w-8 flex items-center justify-center rounded text-charcoal disabled:opacity-30 hover:bg-slate transition-colors"
        >
          ‹
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
          className="h-8 w-8 flex items-center justify-center rounded text-charcoal disabled:opacity-30 hover:bg-slate transition-colors"
        >
          ›
        </button>
      </div>
    </nav>
  );
}
