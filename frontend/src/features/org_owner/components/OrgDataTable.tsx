"use client";

import { cn } from "@/src/lib/utils";

export interface OrgTableColumn<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  cellClass?: string;
  headerClass?: string;
  hideOnMobile?: boolean;
}

interface OrgDataTableProps<T> {
  columns: OrgTableColumn<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  onRowClick?: (row: T) => void;
  className?: string;
}

export default function OrgDataTable<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  className,
}: OrgDataTableProps<T>) {
  return (
    /* Horizontal scroll container — clips overflow on mobile, auto on larger screens */
    <div className={cn("border border-border bg-surface overflow-hidden", className)}>
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse" style={{ minWidth: "520px" }}>
          <thead>
            <tr className="border-b border-border bg-navy/3">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-4 py-3 text-caption font-semibold uppercase tracking-[0.1em] text-muted whitespace-nowrap",
                    col.hideOnMobile && "hidden sm:table-cell",
                    col.headerClass,
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
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  "border-b border-border/60 last:border-b-0 transition-colors",
                  onRowClick && "cursor-pointer hover:bg-slate/50",
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      "px-4 py-3 text-small text-charcoal",
                      col.hideOnMobile && "hidden sm:table-cell",
                      col.cellClass,
                    )}
                  >
                    {col.render
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[col.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
